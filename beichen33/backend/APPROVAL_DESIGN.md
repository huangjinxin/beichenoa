# 审批流程系统设计方案

## 一、核心设计理念

### 1.1 分离原则
- **表单设计**：只负责数据收集（字段配置、明细表、计算等）
- **审批设计**：独立管理审批流程（审批人、审批顺序、权限等）
- **审批执行**：运行时的审批任务和记录

### 1.2 流程类型
- **串行审批**：按顺序逐级审批（A→B→C）
- **并行审批**：同级多人审批（A、B同时审批）
- **会签模式**：并行审批需全部通过才进入下一级
- **或签模式**：并行审批任意一人通过即可

---

## 二、数据库模型设计

### 2.1 核心表结构

```prisma
// ==================== 审批流程配置 ====================

// 审批流程模板
model ApprovalFlow {
  id          String    @id @default(uuid())
  name        String    // 流程名称，如"请假审批流程"
  description String?   // 流程描述

  // 关联的表单模板（可选，流程可以独立于表单）
  formTemplateId String?
  formTemplate   FormTemplate? @relation(fields: [formTemplateId], references: [id])

  // 流程配置
  isActive    Boolean   @default(true)  // 是否启用

  // 流程节点
  nodes       ApprovalNode[]

  // 使用此流程的提交记录
  submissions FormSubmission[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([formTemplateId])
}

// 审批节点（流程中的每一步）
model ApprovalNode {
  id          String    @id @default(uuid())
  flowId      String
  flow        ApprovalFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)

  name        String    // 节点名称，如"部门主管审批"
  sequence    Int       // 节点顺序（1,2,3...）

  // 审批类型
  type        ApprovalNodeType  // SERIAL(串行) | PARALLEL(并行)

  // 并行审批模式（仅在type=PARALLEL时有效）
  parallelMode ParallelMode?    // AND(会签-全部通过) | OR(或签-任意通过)

  // 审批人配置
  approvers   Json      // [{ userId: "xxx", userName: "张三" }, ...]

  // 审批权限
  canReject   Boolean   @default(true)   // 是否可以驳回
  canReturn   Boolean   @default(true)   // 是否可以退回上一级
  canTransfer Boolean   @default(false)  // 是否可以转交他人

  // 超时设置
  timeoutHours Int?     // 超时小时数（可选）

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([flowId])
  @@index([sequence])
}

enum ApprovalNodeType {
  SERIAL      // 串行
  PARALLEL    // 并行
}

enum ParallelMode {
  AND  // 会签：全部通过
  OR   // 或签：任意通过
}

// ==================== 审批执行 ====================

// 审批任务（每个审批人的待办事项）
model ApprovalTask {
  id            String    @id @default(uuid())

  // 关联的提交记录
  submissionId  String
  submission    FormSubmission @relation(fields: [submissionId], references: [id])

  // 流程节点信息
  flowId        String    // 审批流程ID
  nodeId        String    // 审批节点ID
  nodeName      String    // 节点名称（冗余，便于查询）
  nodeSequence  Int       // 节点顺序（冗余，便于排序）

  // 审批人信息
  approverId    String
  approver      User      @relation(fields: [approverId], references: [id])

  // 任务状态
  status        ApprovalTaskStatus  @default(PENDING)

  // 审批结果
  action        ApprovalAction?     // APPROVE | REJECT | RETURN | TRANSFER
  comment       String?             // 审批意见

  // 转交信息（如果有转交操作）
  transferredTo String?   // 转交给谁
  transferredToUser User? @relation("TransferredTasks", fields: [transferredTo], references: [id])

  // 时间信息
  assignedAt    DateTime  @default(now())  // 任务分配时间
  completedAt   DateTime?                  // 完成时间

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([submissionId])
  @@index([approverId, status])
  @@index([status])
  @@index([assignedAt])
}

enum ApprovalTaskStatus {
  PENDING     // 待审批
  APPROVED    // 已通过
  REJECTED    // 已驳回
  RETURNED    // 已退回
  TRANSFERRED // 已转交
  CANCELLED   // 已取消（提交人撤回）
}

enum ApprovalAction {
  APPROVE   // 通过
  REJECT    // 驳回
  RETURN    // 退回
  TRANSFER  // 转交
}

// ==================== 更新现有模型 ====================

// FormTemplate 简化
model FormTemplate {
  id          String    @id @default(uuid())
  title       String
  description String?
  fields      Json
  detailTableConfig Json?
  calculations Json?
  serialNumberConfig Json?
  shareToken  String?   @unique

  isPreset    Boolean   @default(false)
  presetType  String?
  isActive    Boolean   @default(true)

  // 关联审批流程（一个表单可以有多个审批流程）
  approvalFlows ApprovalFlow[]

  submissions FormSubmission[]
  entityBindings FormEntityBinding[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([title])
  @@index([isPreset])
  @@index([shareToken])
}

// FormSubmission 更新
model FormSubmission {
  id            String    @id @default(uuid())
  templateId    String
  template      FormTemplate @relation(fields: [templateId], references: [id])

  serialNumber  String?
  submittedBy   String
  user          User      @relation(fields: [submittedBy], references: [id])

  data          Json      // 表单数据
  detailData    Json?     // 明细表数据
  calculatedValues Json?  // 计算值

  // 审批流程信息
  approvalFlowId String?
  approvalFlow   ApprovalFlow? @relation(fields: [approvalFlowId], references: [id])

  // 当前审批状态
  approvalStatus ApprovalSubmissionStatus @default(DRAFT)

  // 当前审批节点
  currentNodeSequence Int  @default(0)  // 0表示未开始审批，1开始第一级

  // 审批任务
  approvalTasks ApprovalTask[]

  // 实体关联
  entityLinks FormEntityLink[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@index([templateId])
  @@index([submittedBy])
  @@index([approvalStatus])
  @@index([approvalFlowId])
}

enum ApprovalSubmissionStatus {
  DRAFT       // 草稿（未提交）
  PENDING     // 审批中
  APPROVED    // 已通过
  REJECTED    // 已驳回
  RETURNED    // 已退回（需修改）
  CANCELLED   // 已撤回
}
```

---

## 三、业务流程设计

### 3.1 表单设计阶段
```
1. 管理员创建表单模板
   - 配置字段（文本、日期、选择等）
   - 配置明细表（可选）
   - 配置计算规则（可选）
   - 保存表单模板

2. 此时表单模板不包含审批流程
```

### 3.2 审批流程配置阶段
```
1. 管理员为表单配置审批流程
   - 点击"配置审批"按钮
   - 添加审批节点
     - 节点1：部门主管（单人审批）
     - 节点2：财务审批（多人会签）
     - 节点3：园长审批（单人审批）
   - 为每个节点指定审批人
   - 设置审批权限（驳回/退回/转交）
   - 保存审批流程

2. 一个表单可以配置多个审批流程
   - 普通流程：部门主管 → 园长
   - 加急流程：直接园长
   - 金额流程：根据金额动态选择
```

### 3.3 表单提交流程
```
1. 用户填写表单
2. 提交时选择审批流程（如果有多个）
3. 系统创建FormSubmission
   - approvalStatus = PENDING
   - currentNodeSequence = 1
4. 系统为第一个节点的审批人创建ApprovalTask
   - status = PENDING
5. 通知审批人（邮件/站内消息）
```

### 3.4 审批执行流程

#### 串行审批
```
节点1（部门主管）
  ↓ 通过
节点2（财务）
  ↓ 通过
节点3（园长）
  ↓ 通过
完成（数据同步到业务模块）
```

#### 并行审批（会签）
```
节点1（部门主管）
  ↓ 通过
节点2（并行）
  ├── 财务主管 → 通过
  ├── 人事主管 → 通过
  └── 采购主管 → 通过（全部通过才进入下一级）
  ↓
节点3（园长）
  ↓ 通过
完成
```

#### 并行审批（或签）
```
节点1（部门主管）
  ↓ 通过
节点2（并行或签）
  ├── 值班园长A → 通过（任意一人通过即可）
  ├── 值班园长B → 待审批
  └── 值班园长C → 待审批
  ↓
节点3（园长）
  ↓ 通过
完成
```

### 3.5 审批操作

#### 通过操作
```
1. 审批人点击"通过"
2. 更新ApprovalTask
   - status = APPROVED
   - action = APPROVE
   - completedAt = now()
3. 检查当前节点是否完成
   - 串行：直接进入下一节点
   - 并行会签：检查是否所有人都通过
   - 并行或签：任意一人通过即可
4. 如果节点完成
   - currentNodeSequence++
   - 为下一节点的审批人创建ApprovalTask
5. 如果是最后一个节点
   - approvalStatus = APPROVED
   - 触发数据同步到业务模块
```

#### 驳回操作
```
1. 审批人点击"驳回"
2. 更新ApprovalTask
   - status = REJECTED
   - action = REJECT
3. 更新FormSubmission
   - approvalStatus = REJECTED
   - 所有后续的PENDING任务取消
4. 通知提交人
```

#### 退回操作
```
1. 审批人点击"退回"
2. 更新ApprovalTask
   - status = RETURNED
   - action = RETURN
3. 更新FormSubmission
   - approvalStatus = RETURNED
   - currentNodeSequence--（退回上一级）
4. 为上一节点的审批人创建新的ApprovalTask
5. 通知上一级审批人或提交人
```

#### 转交操作
```
1. 审批人点击"转交"，选择转交人
2. 更新原ApprovalTask
   - status = TRANSFERRED
   - action = TRANSFER
   - transferredTo = 新审批人ID
3. 创建新的ApprovalTask
   - approverId = 新审批人ID
   - status = PENDING
4. 通知新审批人
```

---

## 四、功能清单

### 4.1 管理员功能
- ✅ 创建/编辑/删除审批流程
- ✅ 配置审批节点和审批人
- ✅ 查看所有审批记录
- ✅ 强制结束/撤回审批

### 4.2 提交人功能
- ✅ 填写表单并提交
- ✅ 选择审批流程（如果有多个）
- ✅ 查看审批进度
- ✅ 撤回提交（审批中）
- ✅ 修改并重新提交（退回后）

### 4.3 审批人功能
- ✅ 查看待审批列表
- ✅ 查看审批详情
- ✅ 通过/驳回/退回审批
- ✅ 转交给其他人
- ✅ 查看审批历史
- ✅ 批量审批

### 4.4 系统功能
- ✅ 消息通知（新的待审批）
- ✅ 超时提醒
- ✅ 审批统计
- ✅ 审批流程图可视化

---

## 五、API接口设计

### 5.1 审批流程管理
```
GET    /api/approvals/flows              获取审批流程列表
GET    /api/approvals/flows/:id          获取审批流程详情
POST   /api/approvals/flows              创建审批流程
PUT    /api/approvals/flows/:id          更新审批流程
DELETE /api/approvals/flows/:id          删除审批流程

POST   /api/approvals/flows/:id/nodes    添加审批节点
PUT    /api/approvals/nodes/:id          更新审批节点
DELETE /api/approvals/nodes/:id          删除审批节点
```

### 5.2 表单提交与审批
```
POST   /api/forms/submissions            提交表单（选择审批流程）
GET    /api/approvals/my-tasks           我的待审批列表
GET    /api/approvals/my-tasks/:id       待审批详情
POST   /api/approvals/tasks/:id/approve  审批通过
POST   /api/approvals/tasks/:id/reject   审批驳回
POST   /api/approvals/tasks/:id/return   审批退回
POST   /api/approvals/tasks/:id/transfer 审批转交

GET    /api/approvals/submissions/:id    查看提交的审批进度
POST   /api/approvals/submissions/:id/cancel  撤回提交
```

### 5.3 审批统计
```
GET    /api/approvals/statistics         审批统计数据
GET    /api/approvals/history            审批历史记录
```

---

## 六、前端页面设计

### 6.1 表单模板管理
```
列表操作：
- [创建表单] [配置审批] [分享] [编辑] [删除]
```

### 6.2 审批流程配置页面
```
ApprovalFlowConfig.tsx
- 流程基本信息
- 节点列表（可拖拽排序）
- 添加节点
  - 节点名称
  - 审批类型（串行/并行）
  - 并行模式（会签/或签）
  - 选择审批人（多选）
  - 权限设置
```

### 6.3 待审批列表
```
MyApprovalTasks.tsx
- 表格显示
  - 表单标题
  - 提交人
  - 提交时间
  - 当前节点
  - 操作按钮
- 筛选：待审批/已审批/全部
```

### 6.4 审批详情页面
```
ApprovalDetail.tsx
- 表单内容展示
- 审批流程图
- 审批历史
- 审批操作区
  - [通过] [驳回] [退回] [转交]
  - 审批意见输入框
```

---

## 七、数据流转示例

### 示例：请假审批

#### 1. 配置阶段
```json
{
  "flowName": "请假审批流程",
  "nodes": [
    {
      "sequence": 1,
      "name": "班主任审批",
      "type": "SERIAL",
      "approvers": [{ "userId": "teacher-001", "userName": "张老师" }]
    },
    {
      "sequence": 2,
      "name": "年级主任审批",
      "type": "SERIAL",
      "approvers": [{ "userId": "director-001", "userName": "李主任" }]
    },
    {
      "sequence": 3,
      "name": "园长审批",
      "type": "SERIAL",
      "approvers": [{ "userId": "principal-001", "userName": "王园长" }]
    }
  ]
}
```

#### 2. 提交阶段
```json
{
  "submissionId": "sub-001",
  "templateId": "form-leave",
  "approvalFlowId": "flow-001",
  "approvalStatus": "PENDING",
  "currentNodeSequence": 1,
  "data": {
    "studentName": "小明",
    "leaveDate": "2024-01-15",
    "reason": "生病"
  }
}
```

#### 3. 创建审批任务
```json
{
  "taskId": "task-001",
  "submissionId": "sub-001",
  "nodeSequence": 1,
  "nodeName": "班主任审批",
  "approverId": "teacher-001",
  "status": "PENDING"
}
```

#### 4. 张老师审批通过
```json
{
  "taskId": "task-001",
  "status": "APPROVED",
  "action": "APPROVE",
  "comment": "同意请假",
  "completedAt": "2024-01-14T10:00:00Z"
}
```

系统自动：
- currentNodeSequence = 2
- 创建task-002给李主任

#### 5. 李主任审批通过
系统自动：
- currentNodeSequence = 3
- 创建task-003给王园长

#### 6. 王园长审批通过
系统自动：
- approvalStatus = "APPROVED"
- 数据同步到学生管理模块
- 发送通知给提交人

---

## 八、优势总结

### 8.1 职责分离
- 表单只管数据收集
- 审批只管流程控制
- 互不干扰，易于维护

### 8.2 灵活配置
- 一个表单可以配置多个审批流程
- 审批流程可以复用
- 支持动态调整审批人

### 8.3 清晰追溯
- 每个审批操作都有记录
- 完整的审批历史
- 支持审批流程图可视化

### 8.4 扩展性强
- 支持串行/并行
- 支持会签/或签
- 支持转交/退回
- 易于添加新的审批类型

### 8.5 用户体验好
- 审批人有独立的待办列表
- 提交人可以实时查看进度
- 消息通知及时
- 操作简单直观
