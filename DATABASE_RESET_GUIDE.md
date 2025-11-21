# 数据库重置指南

## 📋 使用场景

适用于：
- ✅ 开发早期，Schema 频繁变更
- ✅ 测试环境需要从干净状态开始
- ✅ 生产环境数据量少，可以重新导入

**不适用于：**
- ❌ 生产环境有大量真实用户数据
- ❌ 需要保留历史迁移记录

## 🚀 完整操作流程

### Step 1: 开发环境重置（Mac）

```bash
# 1. 进入项目根目录
cd /Users/huang/Downloads/bigh/web-huang/beichenoa

# 2. 运行重置脚本
./reset-database.sh

# 提示：输入 YES 确认
# 提示：选择是否备份（开发环境可以不备份）
```

**脚本会自动执行：**
1. 删除旧迁移文件
2. 重置数据库
3. 创建新迁移（名称：init_with_user_approval）
4. 运行 seed 恢复测试数据

### Step 2: 测试功能

```bash
# 启动后端
cd beichen33/backend
npm run start:dev

# 启动前端（新终端）
cd beichen33/frontend
npm run dev
```

**测试项目：**

1. **登录测试**
   - 访问：http://localhost:8892/login
   - 账号：admin@beichen.com
   - 密码：admin123
   - ✅ 应该能成功登录

2. **注册测试**
   - 访问：http://localhost:8892/register
   - 填写注册信息
   - ✅ 应该显示"注册成功，等待审核"

3. **审核测试**
   - 管理员登录
   - 访问：http://localhost:8892/system/users
   - 切换到"待审核用户" Tab
   - ✅ 应该看到刚注册的用户
   - 点击"审核通过"
   - ✅ 应该能成功审核

### Step 3: 提交代码

```bash
# 查看状态
git status

# 应该显示：
# - beichen33/backend/prisma/migrations/[时间戳]_init_with_user_approval/（新迁移文件）
# - 其他已提交的文件

# 添加迁移文件
git add beichen33/backend/prisma/migrations

# 提交
git commit -m "chore: 添加数据库迁移文件"

# 推送到 GitHub
git push origin main
```

### Step 4: 生产环境重置（beichen-mini）

```bash
# 1. SSH 到生产服务器
ssh beichentech@beichen-mini

# 2. 进入项目目录
cd /Users/beichentech/Documents/bc-web/北辰online/workspace/beichenoa

# 3. 拉取最新代码
git pull origin main

# 4. 运行重置脚本
./reset-database.sh

# 提示：输入 YES 确认
# 提示：选择是否备份（生产环境建议备份）

# 5. 重启 Docker 容器（确保应用使用新数据库）
cd beichen33
docker compose down
docker compose up -d

# 6. 查看容器状态
docker compose ps
docker compose logs -f backend
```

## ⚠️ 重要提示

### 开发环境

- ✅ 可以随意重置
- ✅ 不需要备份
- ✅ 数据可以重新生成

### 生产环境

- ⚠️ **强烈建议先备份！**
- ⚠️ 确认数据可以重新导入
- ⚠️ 在低峰时段操作
- ⚠️ 通知团队成员

### 备份数据（生产环境）

```bash
# 方法 1：使用脚本的备份功能
./reset-database.sh
# 选择 y 备份

# 方法 2：手动备份
cd beichen33/backend
pg_dump kindergarten > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
psql kindergarten < backup_20251121_120000.sql
```

## 🔧 故障排除

### 问题 1：脚本执行失败

```bash
# 检查是否在正确目录
pwd  # 应该显示 .../beichenoa

# 检查脚本权限
ls -la reset-database.sh

# 如果没有执行权限
chmod +x reset-database.sh
```

### 问题 2：数据库连接失败

```bash
# 检查数据库是否运行
docker compose ps

# 检查环境变量
cd beichen33/backend
cat .env | grep DATABASE_URL

# 重启数据库容器
docker compose restart postgres
```

### 问题 3：Seed 失败

```bash
# 手动运行 seed
cd beichen33/backend
npm run seed

# 查看详细错误
npm run seed 2>&1 | tee seed-error.log
```

### 问题 4：迁移文件冲突

```bash
# 如果 Git 拉取时有冲突
# 使用本地版本（开发环境）
git checkout --theirs beichen33/backend/prisma/migrations

# 使用远程版本（生产环境）
git checkout --ours beichen33/backend/prisma/migrations

# 然后重新运行重置脚本
./reset-database.sh
```

## 📊 验证结果

### 1. 检查迁移状态

```bash
cd beichen33/backend
npx prisma migrate status
```

应该显示：
```
Database schema is up to date!
```

### 2. 检查数据

```bash
# 启动 Prisma Studio
cd beichen33/backend
npx prisma studio

# 在浏览器中查看：http://localhost:5555
```

应该看到：
- ✅ 1 个管理员用户（admin@beichen.com）
- ✅ 2 个教师用户
- ✅ 所有用户的 approvalStatus 都是 APPROVED
- ✅ 班级、学生等数据完整

### 3. 检查应用功能

- ✅ 登录功能正常
- ✅ 注册功能正常
- ✅ 审核功能正常
- ✅ 用户管理页面显示正常

## 🎯 脚本功能说明

### 自动化流程

```
1. 检查目录和环境 ✅
2. 显示警告，等待确认（输入 YES）✅
3. 可选：备份数据库 ✅
4. 删除所有旧迁移文件 ✅
5. 重置数据库（删除所有数据）✅
6. 创建新的迁移文件 ✅
7. 运行 seed 脚本 ✅
8. 验证结果 ✅
9. 显示完成信息和下一步操作 ✅
```

### 安全措施

- ✅ 必须手动输入 YES 才能继续
- ✅ 提供备份选项
- ✅ 检测生产环境并给出警告
- ✅ 任何步骤失败都会停止
- ✅ 详细的日志输出

## 📞 需要帮助？

如果遇到问题：

1. 查看脚本输出的错误信息
2. 检查数据库日志
3. 查看 Docker 容器日志
4. 参考故障排除部分

## 🎉 常见问答

### Q1：重置后数据会丢失吗？
A：是的，所有数据会被删除。但 seed 脚本会恢复测试数据（管理员、教师、学生等）。

### Q2：需要手动删除迁移文件吗？
A：不需要，脚本会自动删除。

### Q3：可以在生产环境使用吗？
A：可以，但请谨慎！建议先备份，并在低峰时段操作。

### Q4：如果忘记备份怎么办？
A：如果是开发环境，重新运行 seed 即可。如果是生产环境且数据重要，请不要使用此脚本。

### Q5：多久需要重置一次？
A：开发早期可能频繁重置。项目稳定后，应该使用正常的迁移流程。

### Q6：两个环境都必须重置吗？
A：是的。因为迁移历史必须一致，所以两个环境都要重置。

---

## ⚡ 快速参考

```bash
# 开发环境（Mac）
cd /Users/huang/Downloads/bigh/web-huang/beichenoa
./reset-database.sh
# 输入 YES 确认
# 测试功能
git add -A
git commit -m "chore: 数据库迁移"
git push

# 生产环境（beichen-mini）
ssh beichentech@beichen-mini
cd /Users/beichentech/Documents/bc-web/北辰online/workspace/beichenoa
git pull
./reset-database.sh
# 输入 YES 确认，建议备份（y）
cd beichen33
docker compose down && docker compose up -d
```

完成！🎊
