# 表单与审批数据流转设计方案

## 一、核心设计理念

### 1.1 数据分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    表单模板层 (FormTemplate)                  │
│  ● 字段配置、审批流程配置、计算规则                              │
│  ● 删除不影响已提交数据                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ 基于模板填写
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  表单提交层 (FormSubmission)                   │
│  ● 临时存储原始填写数据                                        │
│  ● 审批状态流转：草稿 → 审批中 → 已通过/已驳回                   │
│  ● 审批通过后同步到业务层                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ 审批通过后同步
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              业务数据层 (Student/Teacher/Class等)              │
│  ● 永久存储的正式数据                                          │
│  ● 用户在业务模块直接管理                                       │
│  ● 表单删除不影响这里的数据                                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 数据流转规则

| 阶段 | 操作 | FormSubmission状态 | 业务数据 |
|------|------|-------------------|---------|
| 创建 | 用户填写表单 | DRAFT → PENDING | 不创建 |
| 审批 | 审批人操作 | PENDING → 审批中 | 不创建 |
| 通过 | 最终审批通过 | APPROVED | **同步创建/更新** |
| 驳回 | 审批驳回 | REJECTED | 不创建 |
| 退回 | 退回修改 | RETURNED | 不创建 |

---

## 二、数据库Schema调整

### 2.1 FormSubmission 模型更新

```prisma
model FormSubmission {
  id          String    @id @default(uuid())
  templateId  String
  template    FormTemplate @relation(fields: [templateId], references: [id])

  // 流水号
  serialNumber String?

  // 提交人
  submittedBy String
  user        User      @relation(fields: [submittedBy], references: [id])

  // 主表数据
  data        Json

  // 明细表数据
  detailData  Json?

  // 计算结果
  calculatedValues Json?

  // ==================== 审批相关 ====================

  // 关联的审批流程
  approvalFlowId String?
  approvalFlow   ApprovalFlow? @relation(fields: [approvalFlowId], references: [id])

  // 审批状态
  approvalStatus ApprovalSubmissionStatus @default(DRAFT)

  // 当前审批节点序号
  currentNodeSequence Int @default(0)

  // 审批任务
  approvalTasks ApprovalTask[]

  // ==================== 业务数据同步相关 ====================

  // 是否已同步到业务数据
  syncedToBusinessData Boolean @default(false)

  // 同步时间
  syncedAt DateTime?

  // 业务数据关联记录（支持多条，如一个表单可能创建学生+家长）
  businessDataLinks BusinessDataLink[]

  // ==================== 元数据 ====================

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([templateId])
  @@index([submittedBy])
  @@index([approvalStatus])
  @@index([approvalFlowId])
  @@index([serialNumber])
  @@index([syncedToBusinessData])
}
```

### 2.2 新增 BusinessDataLink 模型

```prisma
// 表单提交与业务数据的关联记录
model BusinessDataLink {
  id           String   @id @default(uuid())

  // 关联的表单提交
  submissionId String
  submission   FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  // 业务数据类型和ID
  businessType String   // student, teacher, class, parent
  businessId   String   // 对应业务表的ID

  // 操作类型
  actionType   String   // created（新建）, updated（更新）, linked（关联）

  // 字段映射快照（用于追溯）
  fieldMappings Json?

  // 同步前的数据快照（用于回滚）
  previousData Json?

  // 同步后的数据
  newData      Json?

  // 同步状态
  syncStatus   SyncStatus @default(SUCCESS)

  // 错误信息（如果同步失败）
  errorMessage String?

  createdAt    DateTime @default(now())

  @@index([submissionId])
  @@index([businessType, businessId])
  @@index([syncStatus])
}

enum SyncStatus {
  SUCCESS    // 同步成功
  FAILED     // 同步失败
  ROLLED_BACK // 已回滚
}
```

### 2.3 更新 FormTemplate 模型

```prisma
model FormTemplate {
  id          String    @id @default(uuid())
  title       String
  description String?

  // 字段配置
  fields      Json

  // 明细表配置
  detailTableConfig Json?

  // 计算规则
  calculations Json?

  // 流水号配置
  serialNumberConfig Json?

  // 分享token
  shareToken  String?   @unique

  // 预置模板标识
  isPreset    Boolean   @default(false)
  presetType  String?

  // 是否启用
  isActive    Boolean   @default(true)

  // ==================== 业务数据映射配置 ====================

  // 主要业务类型（该表单主要操作哪种业务数据）
  primaryBusinessType String?  // student, teacher, class, parent

  // 操作类型
  businessActionType  String?  // create, update, link

  // 字段映射配置
  // [{
  //   formField: "studentName",
  //   businessField: "name",
  //   businessType: "student"
  // }]
  fieldMappings Json?

  // 唯一性校验配置
  // [{
  //   formField: "idCard",
  //   businessField: "idCard",
  //   businessType: "student",
  //   errorMessage: "该身份证号已存在"
  // }]
  uniqueValidations Json?

  // ==================== 关联 ====================

  submissions FormSubmission[]
  approvalFlows ApprovalFlow[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([title])
  @@index([isPreset])
  @@index([presetType])
  @@index([shareToken])
  @@index([primaryBusinessType])
}
```

### 2.4 完整的枚举定义

```prisma
enum ApprovalSubmissionStatus {
  DRAFT       // 草稿（未提交）
  PENDING     // 待审批（已提交，等待第一级审批）
  IN_PROGRESS // 审批中（正在经过多级审批）
  APPROVED    // 已通过
  REJECTED    // 已驳回
  RETURNED    // 已退回（需修改后重新提交）
  CANCELLED   // 已撤回
}

enum SyncStatus {
  SUCCESS
  FAILED
  ROLLED_BACK
}
```

---

## 三、业务数据同步服务设计

### 3.1 核心同步流程

```typescript
// business-sync.service.ts
@Injectable()
export class BusinessSyncService {
  constructor(private prisma: PrismaService) {}

  /**
   * 审批通过后同步业务数据
   */
  async syncAfterApproval(submissionId: string): Promise<SyncResult> {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: { template: true },
    });

    if (!submission) {
      throw new Error('表单提交不存在');
    }

    if (submission.approvalStatus !== 'APPROVED') {
      throw new Error('只有审批通过的表单才能同步');
    }

    if (submission.syncedToBusinessData) {
      throw new Error('该表单已同步，请勿重复操作');
    }

    const template = submission.template;
    const formData = submission.data as any;
    const fieldMappings = template.fieldMappings as FieldMapping[];

    if (!fieldMappings || fieldMappings.length === 0) {
      // 没有配置字段映射，标记为已同步但不创建业务数据
      await this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          syncedToBusinessData: true,
          syncedAt: new Date(),
        },
      });
      return { success: true, message: '无业务数据需要同步' };
    }

    try {
      // 1. 数据验证（唯一性检查）
      await this.validateUniqueFields(template, formData);

      // 2. 按业务类型分组字段映射
      const groupedMappings = this.groupMappingsByBusinessType(fieldMappings);

      // 3. 逐个业务类型同步数据
      const syncResults: BusinessDataLink[] = [];

      for (const [businessType, mappings] of Object.entries(groupedMappings)) {
        const result = await this.syncToBusinessTable(
          submissionId,
          businessType,
          mappings,
          formData,
          template.businessActionType || 'create'
        );
        syncResults.push(result);
      }

      // 4. 更新提交记录
      await this.prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          syncedToBusinessData: true,
          syncedAt: new Date(),
        },
      });

      return {
        success: true,
        message: `成功同步 ${syncResults.length} 条业务数据`,
        links: syncResults,
      };

    } catch (error) {
      // 记录错误
      await this.prisma.businessDataLink.create({
        data: {
          submissionId,
          businessType: template.primaryBusinessType || 'unknown',
          businessId: '',
          actionType: 'failed',
          syncStatus: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * 同步到具体业务表
   */
  private async syncToBusinessTable(
    submissionId: string,
    businessType: string,
    mappings: FieldMapping[],
    formData: any,
    actionType: string
  ): Promise<BusinessDataLink> {

    // 构建业务数据
    const businessData: any = {};
    for (const mapping of mappings) {
      const value = formData[mapping.formField];
      if (value !== undefined && value !== null && value !== '') {
        businessData[mapping.businessField] = value;
      }
    }

    let businessId: string;
    let previousData: any = null;

    switch (businessType) {
      case 'student':
        if (actionType === 'create') {
          // 需要 campusId 和 classId
          const student = await this.prisma.student.create({
            data: {
              ...businessData,
              campusId: businessData.campusId || 'default-campus-id', // 需要从上下文获取
            },
          });
          businessId = student.id;
        } else if (actionType === 'update') {
          const studentId = formData.studentId;
          previousData = await this.prisma.student.findUnique({ where: { id: studentId } });
          const student = await this.prisma.student.update({
            where: { id: studentId },
            data: businessData,
          });
          businessId = student.id;
        }
        break;

      case 'teacher':
      case 'user':
        if (actionType === 'create') {
          // 创建教师账号
          const user = await this.prisma.user.create({
            data: {
              ...businessData,
              password: await this.hashPassword('123456'), // 默认密码
              role: 'TEACHER',
              campusId: businessData.campusId || 'default-campus-id',
            },
          });
          businessId = user.id;
        } else if (actionType === 'update') {
          const userId = formData.userId;
          previousData = await this.prisma.user.findUnique({ where: { id: userId } });
          const user = await this.prisma.user.update({
            where: { id: userId },
            data: businessData,
          });
          businessId = user.id;
        }
        break;

      case 'parent':
        if (actionType === 'create') {
          const parent = await this.prisma.parent.create({
            data: businessData,
          });
          businessId = parent.id;

          // 如果有学生ID，创建关联
          if (formData.studentId) {
            await this.prisma.studentParent.create({
              data: {
                studentId: formData.studentId,
                parentId: parent.id,
                isPrimary: formData.isPrimaryContact || false,
              },
            });
          }
        }
        break;

      default:
        throw new Error(`不支持的业务类型: ${businessType}`);
    }

    // 创建关联记录
    const link = await this.prisma.businessDataLink.create({
      data: {
        submissionId,
        businessType,
        businessId,
        actionType,
        fieldMappings: mappings,
        previousData,
        newData: businessData,
        syncStatus: 'SUCCESS',
      },
    });

    return link;
  }

  /**
   * 唯一性验证
   */
  private async validateUniqueFields(template: any, formData: any) {
    const uniqueValidations = template.uniqueValidations as any[];
    if (!uniqueValidations || uniqueValidations.length === 0) return;

    for (const validation of uniqueValidations) {
      const value = formData[validation.formField];
      if (!value) continue;

      let exists = false;

      switch (validation.businessType) {
        case 'student':
          exists = await this.prisma.student.findFirst({
            where: { [validation.businessField]: value, deletedAt: null },
          }) !== null;
          break;

        case 'user':
        case 'teacher':
          exists = await this.prisma.user.findFirst({
            where: { [validation.businessField]: value, deletedAt: null },
          }) !== null;
          break;
      }

      if (exists) {
        throw new Error(validation.errorMessage || `${validation.formField} 已存在`);
      }
    }
  }

  /**
   * 按业务类型分组字段映射
   */
  private groupMappingsByBusinessType(mappings: FieldMapping[]): Record<string, FieldMapping[]> {
    return mappings.reduce((acc, mapping) => {
      const type = mapping.businessType || 'default';
      if (!acc[type]) acc[type] = [];
      acc[type].push(mapping);
      return acc;
    }, {} as Record<string, FieldMapping[]>);
  }

  /**
   * 回滚业务数据（用于撤销同步）
   */
  async rollbackSync(submissionId: string): Promise<void> {
    const links = await this.prisma.businessDataLink.findMany({
      where: { submissionId, syncStatus: 'SUCCESS' },
    });

    for (const link of links) {
      if (link.actionType === 'created') {
        // 删除创建的数据
        switch (link.businessType) {
          case 'student':
            await this.prisma.student.delete({ where: { id: link.businessId } });
            break;
          case 'user':
            await this.prisma.user.delete({ where: { id: link.businessId } });
            break;
          case 'parent':
            await this.prisma.parent.delete({ where: { id: link.businessId } });
            break;
        }
      } else if (link.actionType === 'updated' && link.previousData) {
        // 恢复原数据
        switch (link.businessType) {
          case 'student':
            await this.prisma.student.update({
              where: { id: link.businessId },
              data: link.previousData as any,
            });
            break;
          case 'user':
            await this.prisma.user.update({
              where: { id: link.businessId },
              data: link.previousData as any,
            });
            break;
        }
      }

      // 更新link状态
      await this.prisma.businessDataLink.update({
        where: { id: link.id },
        data: { syncStatus: 'ROLLED_BACK' },
      });
    }

    // 更新提交记录
    await this.prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        syncedToBusinessData: false,
        syncedAt: null,
      },
    });
  }
}

interface FieldMapping {
  formField: string;
  businessField: string;
  businessType?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  links?: any[];
}
```

---

## 四、API接口设计

### 4.1 表单提交相关

```typescript
// 提交表单（创建并可选择直接提交审批）
POST /api/forms/submissions
Body: {
  templateId: string,
  formData: object,
  detailData?: array,
  submitForApproval?: boolean  // 是否直接提交审批
}

// 更新草稿
PUT /api/forms/submissions/:id
Body: {
  formData: object,
  detailData?: array
}

// 提交审批（从草稿状态提交）
POST /api/forms/submissions/:id/submit
Body: {
  approvalFlowId?: string  // 可选，如果模板有默认流程则不需要
}

// 撤回提交（回到草稿状态）
POST /api/forms/submissions/:id/withdraw

// 获取提交列表
GET /api/forms/submissions
Query: {
  templateId?: string,
  status?: string,
  submittedBy?: string,
  page?: number,
  limit?: number
}

// 获取提交详情（包含审批进度）
GET /api/forms/submissions/:id

// 删除提交记录
DELETE /api/forms/submissions/:id
// 限制：只能删除 DRAFT、REJECTED 状态的记录
```

### 4.2 审批相关

```typescript
// 获取我的待审批列表
GET /api/approvals/my-tasks
Query: {
  status?: 'PENDING' | 'ALL',
  page?: number,
  limit?: number
}

// 获取审批任务详情
GET /api/approvals/tasks/:taskId

// 审批操作
POST /api/approvals/tasks/:taskId/action
Body: {
  action: 'APPROVE' | 'REJECT' | 'RETURN' | 'TRANSFER',
  comment?: string,
  transferTo?: string  // 转交时需要
}

// 查看审批进度
GET /api/forms/submissions/:id/approval-progress
```

### 4.3 业务数据同步相关

```typescript
// 手动触发同步（通常自动执行）
POST /api/forms/submissions/:id/sync-business-data

// 查看同步状态和关联的业务数据
GET /api/forms/submissions/:id/business-links

// 回滚同步（管理员权限）
POST /api/forms/submissions/:id/rollback-sync

// 根据业务数据查询来源表单
GET /api/business-data/source
Query: {
  businessType: 'student' | 'teacher' | 'parent',
  businessId: string
}
```

### 4.4 表单模板配置相关

```typescript
// 配置字段映射
PUT /api/forms/templates/:id/field-mappings
Body: {
  primaryBusinessType: string,
  businessActionType: string,
  fieldMappings: [
    {
      formField: string,
      businessField: string,
      businessType?: string
    }
  ],
  uniqueValidations: [
    {
      formField: string,
      businessField: string,
      businessType: string,
      errorMessage: string
    }
  ]
}
```

---

## 五、前端页面结构

### 5.1 菜单结构

```
表单管理
├─ 表单模板
│   ├─ 模板列表（查看、编辑、删除、配置审批流程、配置字段映射）
│   └─ 创建模板
│
├─ 表单记录
│   ├─ 全部记录（管理员查看）
│   ├─ 我的提交（普通用户）
│   └─ 筛选：按模板、按状态（草稿/待审批/已通过/已驳回）
│
└─ 我的审批
    ├─ 待审批
    ├─ 已处理
    └─ 审批详情页（查看表单内容、操作审批）

业务管理
├─ 学生管理（正式数据，可查看来源表单）
├─ 教师管理（正式数据，可查看来源表单）
├─ 班级管理
└─ 家长管理
```

### 5.2 关键页面设计

#### 表单提交详情页

```tsx
// SubmissionDetail.tsx
- 基本信息卡片
  - 表单标题、流水号、提交人、提交时间
  - 当前状态（显著标记）

- 表单内容卡片
  - 渲染所有字段和填写的值
  - 明细表数据
  - 计算结果

- 审批进度卡片（状态 !== DRAFT 时显示）
  - 流程图展示各节点状态
  - 审批历史时间线

- 业务数据卡片（status === APPROVED 时显示）
  - 已同步的业务数据列表
  - 点击跳转到对应业务详情页

- 操作按钮
  - DRAFT: [编辑] [提交审批] [删除]
  - PENDING: [撤回]
  - RETURNED: [编辑] [重新提交]
  - REJECTED: [删除]
  - APPROVED: [查看业务数据]
```

#### 审批操作页

```tsx
// ApprovalAction.tsx
- 表单内容（只读展示）
- 审批历史
- 当前节点信息
- 操作区域
  - 审批意见输入框
  - [通过] [驳回] [退回] [转交]
```

#### 业务详情页的来源追溯

```tsx
// StudentDetail.tsx
- 学生基本信息
- 操作记录标签页
  - 来源表单（如果是通过表单创建的）
    - 显示表单标题、提交人、审批时间
    - 点击查看原始表单
```

---

## 六、删除逻辑处理

### 6.1 删除表单模板

```typescript
async deleteTemplate(id: string) {
  // 检查是否有未完成的审批
  const pendingCount = await this.prisma.formSubmission.count({
    where: {
      templateId: id,
      approvalStatus: { in: ['PENDING', 'IN_PROGRESS'] },
      deletedAt: null,
    },
  });

  if (pendingCount > 0) {
    throw new Error(`该模板有 ${pendingCount} 条待审批的提交，请先处理完成后再删除`);
  }

  // 软删除模板
  await this.prisma.formTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  // 提交记录保留，可通过 templateId 追溯
  // 业务数据不受影响
}
```

### 6.2 删除表单提交

```typescript
async deleteSubmission(id: string) {
  const submission = await this.prisma.formSubmission.findUnique({
    where: { id },
  });

  if (!submission) {
    throw new Error('提交记录不存在');
  }

  // 只允许删除特定状态的记录
  const deletableStatuses = ['DRAFT', 'REJECTED', 'CANCELLED'];

  if (submission.approvalStatus === 'APPROVED') {
    // 已通过的记录，提示用户
    if (submission.syncedToBusinessData) {
      throw new Error('该记录已同步到业务数据，删除不会影响已创建的业务数据。确认删除请使用强制删除。');
    }
  }

  if (!deletableStatuses.includes(submission.approvalStatus)) {
    throw new Error('只能删除草稿、已驳回或已撤回的记录');
  }

  // 软删除
  await this.prisma.formSubmission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// 强制删除（管理员权限）
async forceDeleteSubmission(id: string) {
  await this.prisma.formSubmission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // 业务数据不删除，但更新关联记录
  await this.prisma.businessDataLink.updateMany({
    where: { submissionId: id },
    data: { /* 可以添加标记 */ },
  });
}
```

### 6.3 删除业务数据

```typescript
async deleteStudent(id: string) {
  // 检查是否有进行中的表单
  const activeSubmissions = await this.prisma.businessDataLink.findMany({
    where: {
      businessType: 'student',
      businessId: id,
    },
    include: {
      submission: true,
    },
  });

  // 软删除学生
  await this.prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // 关联记录保留（用于审计追溯）
  // submission 记录保留
}
```

---

## 七、实现步骤

### Phase 1: 数据库调整（1天）

1. 更新 Prisma Schema
2. 创建数据库迁移
3. 运行迁移

### Phase 2: 后端服务（2-3天）

1. 创建 BusinessSyncService
2. 更新 FormsService 的同步逻辑
3. 更新 ApprovalsService，在审批通过后调用同步
4. 实现删除逻辑
5. 添加 API 端点

### Phase 3: 前端页面（2-3天）

1. 更新表单提交列表页
2. 创建提交详情页
3. 更新审批页面
4. 添加业务数据来源追溯
5. 更新删除确认对话框

### Phase 4: 测试和优化（1-2天）

1. 端到端流程测试
2. 边界情况处理
3. 性能优化
4. 文档完善

---

## 八、关键注意事项

### 8.1 数据一致性

- 同步操作使用事务
- 失败时记录错误，支持重试
- 提供回滚机制

### 8.2 性能考虑

- 批量同步时分批处理
- 异步处理大量数据
- 添加适当的数据库索引

### 8.3 安全性

- 删除操作需要权限验证
- 敏感数据脱敏
- 操作日志记录

### 8.4 用户体验

- 清晰的状态展示
- 操作确认提示
- 错误信息友好
- 数据追溯便捷

---

## 九、数据迁移策略

如果现有系统已有数据，需要制定迁移计划：

1. **备份现有数据**
2. **运行 Schema 迁移**
3. **补充缺失字段默认值**
   - 现有的 APPROVED 记录标记为 `syncedToBusinessData = true`
   - 创建历史的 BusinessDataLink 记录
4. **验证数据完整性**
5. **清理孤立数据**
