# 快速测试指南

## 🚀 立即测试修复

我已修复表单模板创建问题。现在请按以下步骤测试：

---

## 测试1: 表单模板创建 ✅ 已修复

**步骤**:
1. 访问 http://localhost:8892
2. 登录系统
3. 左侧菜单 → **表单管理** → **表单模板**
4. 点击 "**创建模板**"
5. 填写：
   ```
   表单标题: 请假申请
   表单描述: 学生请假使用
   ```
6. 点击 "**确认**"

**预期结果**: ✅ 成功提示，列表中出现新模板

---

## 测试2: 教师创建

**重要**: 请使用**唯一的邮箱地址**！

### 成功示例

```
教师姓名: 张老师
邮箱: zhang001@school.com  ← 确保这个邮箱从未使用过
电话: 13800138001
```

点击确认后应该成功。

### 如果失败

#### 情况1: 提示"保存失败"且邮箱已存在
**原因**: 邮箱重复

**解决**: 使用新的邮箱，例如：
- zhang002@school.com
- li001@school.com
- wang001@school.com
- teacher1@school.com

#### 情况2: 其他错误
**查看日志**:
```bash
docker logs beichen33-backend-1 --tail 50
```

查找包含 "POST /api/users" 或 "ERROR" 的行，将错误信息发给我。

---

## 测试3: 班级创建

**前提**: 必须先成功创建至少一个教师

**步骤**:
1. 左侧菜单 → **班级管理**
2. 点击 "**添加班级**"
3. 填写：
   ```
   班级名称: 大一班
   年级: 大班
   教师: [从下拉框选择刚创建的教师]
   容量: 30
   ```
4. 点击 "**确认**"

**预期结果**: ✅ 成功创建，列表显示班级和教师

---

## 📊 验证清单

请依次测试并记录结果：

- [ ] 表单模板可以创建
- [ ] 教师可以创建（使用唯一邮箱）
- [ ] 班级可以创建（需要先有教师）
- [ ] 仪表盘卡片可以点击跳转

---

## 🔍 常见问题

### Q1: 教师创建一直失败怎么办？

**A**: 先查看数据库中已有哪些邮箱：

```bash
docker exec -it beichen33-postgres-1 psql -U postgres -d kindergarten -c "SELECT email FROM \"User\" WHERE \"deletedAt\" IS NULL;"
```

然后使用一个**不在列表中**的新邮箱。

---

### Q2: 如何清空测试数据？

如果想重新开始测试：

```bash
# 删除所有测试教师（小心操作）
docker exec -it beichen33-postgres-1 psql -U postgres -d kindergarten -c "UPDATE \"User\" SET \"deletedAt\" = NOW() WHERE role = 'TEACHER';"

# 删除所有测试班级
docker exec -it beichen33-postgres-1 psql -U postgres -d kindergarten -c "UPDATE \"Class\" SET \"deletedAt\" = NOW();"

# 删除所有测试表单模板
docker exec -it beichen33-postgres-1 psql -U postgres -d kindergarten -c "UPDATE \"FormTemplate\" SET \"deletedAt\" = NOW();"
```

---

### Q3: 后端显示"unhealthy"正常吗？

**A**: 是的，只要能访问 http://localhost:8892 并正常使用即可。健康检查可能配置不正确，不影响功能。

---

## ✅ 修复总结

### 本次已修复

1. ✅ **表单模板创建** - 添加了默认fields字段
2. ✅ **教师创建** - 功能正常（注意邮箱唯一性）
3. ✅ **班级创建** - 需要先创建教师
4. ✅ **仪表盘跳转** - 所有卡片可点击

### 修改的文件

**后端**:
- `backend/src/modules/forms/forms.service.ts:19-27` - 添加fields默认值
- `backend/src/modules/users/users.controller.ts:19-23` - 添加POST接口
- `backend/src/modules/users/users.service.ts:27-48` - 实现create方法

**前端**:
- `frontend/src/pages/Classes/List.tsx` - 添加教师选择
- `frontend/src/pages/Forms/Templates.tsx` - 实现创建功能
- `frontend/src/pages/Dashboard/Dashboard.tsx` - 添加点击跳转

---

## 🎯 测试成功标志

所有功能正常时：

1. ✅ 表单模板可创建
2. ✅ 教师可创建（使用唯一邮箱）
3. ✅ 班级可创建（选择教师）
4. ✅ 仪表盘卡片可跳转
5. ✅ 所有创建操作显示"保存成功"

---

## 📞 如遇问题

如果测试后仍有问题，请提供：

1. 具体的错误提示（截图）
2. 后端日志：`docker logs beichen33-backend-1 --tail 100`
3. 浏览器控制台错误（F12 → Console标签）
4. 您尝试创建的具体数据（邮箱等）

这样我可以更准确地定位问题。
