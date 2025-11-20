# 审批流程设计器 - 调试指南

## 问题：选择审批人时没有显示教师和职位关系

### 步骤 1: 检查浏览器控制台

1. 打开 Chrome DevTools (F12)
2. 切换到 **Console** 标签
3. 在审批流程设计器页面，点击"添加审批节点"
4. 查看控制台输出，应该能看到：
   ```
   审批人选项: [{userId: "...", userName: "...", email: "...", role: "...", position: "..."}]
   角色选项: [...]
   职位选项: [...]
   ```

### 步骤 2: 检查 Network 请求

1. 切换到 **Network** 标签
2. 筛选 XHR 请求
3. 查找 `/api/approvals/approvers` 请求
4. 检查响应数据，确认：
   - 状态码是否为 200
   - 返回的数据结构是否包含 `position` 字段
   - 示例响应：
     ```json
     [
       {
         "userId": "user-id-123",
         "userName": "张三",
         "email": "zhangsan@example.com",
         "role": "TEACHER",
         "position": "园长",
         "positionType": "PRINCIPAL"
       }
     ]
     ```

### 步骤 3: 检查数据库中是否有职位数据

运行以下命令检查用户和职位关系：

```bash
cd backend
npx prisma studio
```

在 Prisma Studio 中：
1. 打开 **User** 表
2. 检查是否有用户数据，且 `positionId` 字段有值
3. 打开 **Position** 表
4. 检查是否有职位数据

### 步骤 4: 如果没有职位数据，创建测试数据

```bash
cd backend
# 创建职位
curl -X POST http://localhost:3000/api/positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "园长",
    "type": "PRINCIPAL",
    "level": 1
  }'

curl -X POST http://localhost:3000/api/positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "主任",
    "type": "DIRECTOR",
    "level": 2,
    "parentId": "PRINCIPAL_POSITION_ID"
  }'

curl -X POST http://localhost:3000/api/positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "教师",
    "type": "TEACHER",
    "level": 3
  }'
```

### 步骤 5: 关联用户和职位

在系统的"教师管理"页面：
1. 进入教师列表
2. 编辑教师信息
3. 选择对应的职位
4. 保存

或通过 API：
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "positionId": "POSITION_ID"
  }'
```

### 步骤 6: 刷新页面重试

1. 关闭审批流程设计器弹窗
2. 刷新浏览器页面 (Ctrl+F5 / Cmd+Shift+R)
3. 重新打开审批流程设计器
4. 添加审批节点，选择审批人

### 常见问题

#### Q1: API 返回 404
**原因**: 后端服务未启动或路由配置错误
**解决**:
```bash
cd backend
npm run start:dev
```

#### Q2: API 返回 401
**原因**: Token 过期或未登录
**解决**: 重新登录系统

#### Q3: 返回的数据中 position 为 null
**原因**: 用户没有关联职位
**解决**: 按步骤 5 关联用户和职位

#### Q4: 选择器显示但没有职位标签
**原因**: 前端代码未正确显示
**解决**:
- 检查浏览器控制台是否有 JavaScript 错误
- 确认前端代码已更新（清除缓存）

### 技术说明

#### 数据流程
1. 前端调用 `approvalApi.getApproverOptions()`
2. 后端 `ApprovalsService.getApproverOptions()` 查询用户表
3. 通过 `include: { position: { select: { name: true, type: true } } }` 关联查询职位
4. 返回包含职位信息的用户列表
5. 前端在 Select.Option 中显示职位 Tag

#### 审批人类型说明
- **指定用户**: 直接选择具体用户，显示姓名、职位、邮箱
- **角色**: 选择角色（管理员/教师/家长），运行时查询该角色的所有用户
- **职位**: 选择职位（园长/主任/教师），运行时查询该职位的所有用户
- **上级**: 自动根据提交人的职位层级查找其上级

### 联系支持

如果以上步骤都无法解决问题，请提供：
1. 浏览器控制台的完整日志
2. Network 标签中 `/api/approvals/approvers` 请求的完整响应
3. 数据库中 User 和 Position 表的截图
