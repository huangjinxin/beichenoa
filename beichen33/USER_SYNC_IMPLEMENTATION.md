# 用户数据同步实现文档

## 概述

本文档说明教师、学生与用户管理的数据同步机制实现。

## 核心逻辑

### 数据流向
```
Student (学生表) → Parent (家长表) → User (用户表，role=PARENT)
User (教师) → 直接在 User 表中创建 (role=TEACHER)
```

### 同步规则

1. **创建学生时**
   - 自动在 Parent 表创建家长记录
   - 自动在 User 表创建家长账号（role='PARENT'）
   - 账号格式：`身份证号/手机号@student.beichen.edu`
   - 默认密码：123456
   - 记录 sourceType='STUDENT' 和 sourceId=学生ID

2. **修改学生时**
   - 同步更新关联的家长和用户信息（姓名、校区、班级等）

3. **删除学生时**
   - 软删除学生记录（设置 deletedAt）
   - 同步禁用关联的用户账号（isActive=false）
   - 保留历史数据，不物理删除

## 数据库变更

### Schema 修改

#### 1. 添加用户来源枚举
```prisma
enum UserSourceType {
  MANUAL      // 手动创建
  STUDENT     // 从学生同步
  TEACHER_SYNC // 从教师同步（预留）
}
```

#### 2. User 表新增字段
```prisma
model User {
  // ... 其他字段
  sourceType  UserSourceType @default(MANUAL)  // 账号来源类型
  sourceId    String?                          // 来源记录ID
  // ... 其他字段

  @@index([sourceType])
  @@index([sourceId])
}
```

### 创建迁移

```bash
cd beichen33/backend
npx prisma migrate dev --name add_user_source_fields
```

## 数据同步脚本

### 执行历史数据同步

```bash
cd beichen33/backend

# 安装依赖（如果需要）
npm install

# 编译TypeScript（如果需要）
npm run build

# 运行同步脚本
npx ts-node scripts/sync-student-users.ts
```

### 同步脚本功能

脚本位置：`backend/scripts/sync-student-users.ts`

**功能：**
1. 遍历所有学生记录
2. 检查是否已有家长账号
3. 为没有账号的学生创建：
   - User 账号（role='PARENT'）
   - Parent 记录
   - StudentParent 关联
4. 输出详细的同步结果

**账号生成规则：**
- 优先使用：`身份证号@student.beichen.edu`
- 次选：`手机号@student.beichen.edu`
- 兜底：`student_[学生ID前8位]@beichen.edu`

## 后端API修改

### Students Service

需要修改的文件：`backend/src/modules/students/students.service.ts`

#### 1. create() 方法
```typescript
async create(data: any) {
  // 使用事务确保原子性
  return await this.prisma.$transaction(async (tx) => {
    // 1. 创建学生
    const student = await tx.student.create({...});

    // 2. 创建家长用户账号
    const user = await tx.user.create({
      data: {
        email: `${student.idCard || student.primaryPhone}@student.beichen.edu`,
        password: await bcrypt.hash('123456', 10),
        name: `${student.name}家长`,
        phone: student.primaryPhone,
        role: 'PARENT',
        campusId: student.campusId,
        sourceType: 'STUDENT',
        sourceId: student.id,
      },
    });

    // 3. 创建Parent记录
    const parent = await tx.parent.create({
      data: {
        name: `${student.name}家长`,
        phone: student.primaryPhone,
        userId: user.id,
        relation: '家长',
      },
    });

    // 4. 建立学生-家长关联
    await tx.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        isPrimary: true,
      },
    });

    return student;
  });
}
```

#### 2. update() 方法
```typescript
async update(id: string, data: any) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 更新学生
    const student = await tx.student.update({...});

    // 2. 同步更新关联的用户账号
    const parents = await tx.parent.findMany({
      where: {
        students: { some: { studentId: id } },
        userId: { not: null },
      },
    });

    for (const parent of parents) {
      if (parent.userId) {
        await tx.user.update({
          where: { id: parent.userId },
          data: {
            name: `${student.name}家长`,
            phone: student.primaryPhone,
            campusId: student.campusId,
          },
        });
      }
    }

    return student;
  });
}
```

#### 3. remove() 方法
```typescript
async remove(id: string) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 软删除学生
    const student = await tx.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 2. 禁用关联的用户账号
    await tx.user.updateMany({
      where: {
        sourceType: 'STUDENT',
        sourceId: id,
      },
      data: {
        isActive: false,
      },
    });

    return student;
  });
}
```

## 前端页面修改

### 用户管理页面

文件：`frontend/src/pages/System/UserManagement.tsx`

#### 1. 显示数据来源标签

在表格列中添加"来源"列：

```typescript
{
  title: '来源',
  dataIndex: 'sourceType',
  key: 'sourceType',
  width: 120,
  render: (sourceType: string) => {
    const sourceMap = {
      MANUAL: { text: '手动创建', color: 'blue' },
      STUDENT: { text: '学生同步', color: 'green' },
      TEACHER_SYNC: { text: '教师同步', color: 'orange' },
    };
    const config = sourceMap[sourceType] || sourceMap.MANUAL;
    return <Tag color={config.color}>{config.text}</Tag>;
  },
}
```

#### 2. 限制同步用户的编辑

```typescript
const handleEdit = (record: any) => {
  // 如果是同步过来的用户，提示跳转到源头页面
  if (record.sourceType === 'STUDENT') {
    Modal.info({
      title: '提示',
      content: '该账号从学生管理同步，请到"学生管理"页面修改学生信息',
      onOk: () => {
        // 可选：自动跳转到学生管理页面
        // navigate('/students');
      },
    });
    return;
  }
  // ... 正常编辑逻辑
};
```

## 校区名称映射

根据实际数据，更新用户管理页面的校区Tab名称：

```typescript
const userStats = useMemo(() => {
  const stats = {
    admin: users.filter((u: any) => u.role === 'ADMIN'),
    beichen1: users.filter((u: any) => {
      const campusName = getCampusName(u.campusId);
      return u.role === 'TEACHER' && campusName === '北辰核心园';
    }),
    beichen2: users.filter((u: any) => {
      const campusName = getCampusName(u.campusId);
      return u.role === 'TEACHER' && campusName === '三岔路幼儿园';
    }),
    beichen3: users.filter((u: any) => {
      const campusName = getCampusName(u.campusId);
      return u.role === 'TEACHER' && campusName === '彭家山';
    }),
    parent: users.filter((u: any) => u.role === 'PARENT'),
  };
  return stats;
}, [users, campusList]);
```

Tab 标签：
```typescript
<TabPane tab={`北辰核心园 (${userStats.beichen1.length})`} key="beichen1">
<TabPane tab={`三岔路幼儿园 (${userStats.beichen2.length})`} key="beichen2">
<TabPane tab={`彭家山 (${userStats.beichen3.length})`} key="beichen3">
```

## 实施步骤

### 第一步：数据库迁移

```bash
cd beichen33/backend
npx prisma migrate dev --name add_user_source_fields
```

### 第二步：执行历史数据同步

```bash
npx ts-node scripts/sync-student-users.ts
```

### 第三步：修改后端API

修改 `students.service.ts` 中的 create、update、remove 方法添加同步逻辑。

### 第四步：更新前端页面

1. 更新用户管理页面，添加来源标签
2. 限制同步用户的编辑权限
3. 更新校区Tab名称

### 第五步：测试

1. 创建新学生，验证是否自动创建家长账号
2. 修改学生信息，验证是否同步到用户账号
3. 删除学生，验证是否禁用用户账号
4. 登录家长账号，测试功能

## 注意事项

1. **事务处理**：所有涉及多表操作的地方都使用 Prisma 事务确保数据一致性
2. **错误处理**：同步失败时需要回滚整个操作
3. **密码安全**：默认密码 123456 仅用于首次登录，需提示用户修改
4. **数据备份**：执行迁移前务必备份数据库
5. **权限控制**：家长账号只能访问自己孩子的相关信息

## 验证清单

- [ ] Schema 修改完成并创建迁移
- [ ] 历史数据同步脚本执行成功
- [ ] 创建学生自动创建账号
- [ ] 修改学生同步更新账号
- [ ] 删除学生禁用账号
- [ ] 用户管理页面显示来源标签
- [ ] 同步用户限制编辑
- [ ] 校区Tab名称正确
- [ ] 家长账号可正常登录
- [ ] 数据统计准确

## 常见问题

### Q: 历史数据同步时邮箱冲突怎么办？
A: 脚本会自动检测并跳过已存在的邮箱，不会覆盖现有账号。

### Q: 学生没有身份证号和手机号怎么办？
A: 系统会使用学生ID生成唯一邮箱：`student_[ID]@beichen.edu`

### Q: 家长想关联多个孩子怎么办？
A: 通过 StudentParent 多对多关系表，一个家长可以关联多个学生。

### Q: 如何重置家长密码？
A: 在用户管理页面点击"重置密码"按钮，密码重置为 123456。

## 相关文件

- Schema: `backend/prisma/schema.prisma`
- 同步脚本: `backend/scripts/sync-student-users.ts`
- 学生服务: `backend/src/modules/students/students.service.ts`
- 用户管理: `frontend/src/pages/System/UserManagement.tsx`
