# Prisma 数据库迁移指南

## 📋 问题背景

每次修改 Prisma Schema 后如果不创建迁移文件，会导致：

1. **生产环境收不到数据库结构更新**
2. **Schema 与数据库不一致**，导致部署失败
3. **数据丢失风险**，无法回滚变更

## ✅ 解决方案

我们创建了 **自动迁移系统**，包含以下组件：

### 1. 自动迁移脚本 (`prisma-auto-migrate.sh`)

- 开发环境：检测 Schema 变更并创建迁移文件
- 生产环境：自动应用迁移文件
- 保护本地开发数据：不会删除你的开发数据

### 2. Git Pre-Commit Hook

- 自动检测 Schema 变更
- 如果发现 Schema 修改但没有迁移文件，会阻止提交
- 提醒你先创建迁移文件

### 3. GitHub Actions 集成

- 自动在部署时应用迁移
- 确保生产环境数据库始终是最新状态

## 🚀 使用方法

### 开发环境：修改 Schema 后

#### 方法 1：自动检查并创建迁移（推荐）

```bash
# 在项目根目录运行
./prisma-auto-migrate.sh
```

脚本会：
1. 检查 Schema 是否有变更
2. 如果有变更，询问是否创建迁移
3. 创建迁移文件并应用到本地数据库
4. 提示你提交迁移文件到 Git

#### 方法 2：强制创建迁移

```bash
# 跳过检查，直接创建迁移
./prisma-auto-migrate.sh --force
```

#### 方法 3：传统方式（手动）

```bash
cd beichen33/backend
npx prisma migrate dev --name describe_your_change
cd ../..
```

### 提交变更到 Git

创建迁移后，将迁移文件提交到 Git：

```bash
# Git 会自动检查是否有迁移文件
git add beichen33/backend/prisma/migrations
git add beichen33/backend/prisma/schema.prisma
git commit -m "feat: add prisma migration for xxx"
git push
```

### 如果 Git 阻止了你的提交

如果你修改了 `schema.prisma` 但没有创建迁移文件，Git 会阻止提交并显示：

```
⚠️  检测到 Prisma Schema 文件变更！
❌ 警告：Schema 已修改，但未检测到新的迁移文件！

建议操作：
  1. 运行脚本创建迁移: ./prisma-auto-migrate.sh
  2. 或手动创建迁移: cd beichen33/backend && npx prisma migrate dev
  3. 然后将迁移文件添加到提交: git add beichen33/backend/prisma/migrations
```

按照提示操作即可。

### 生产环境：自动部署

推送到 GitHub 后，GitHub Actions 会自动：

1. 拉取最新代码
2. 运行 `prisma-auto-migrate.sh`（自动检测为生产环境）
3. 应用所有待处理的迁移
4. 重新构建和部署应用

**你不需要做任何额外操作！**

## 📖 常见问题

### Q1: 我修改了 Schema，但忘记创建迁移就提交了怎么办？

A: Git pre-commit hook 会阻止你提交。按照提示先创建迁移文件即可。

### Q2: 我必须使用脚本吗？可以手动创建迁移吗？

A: 可以手动创建。使用以下命令：

```bash
cd beichen33/backend
npx prisma migrate dev --name your_migration_name
```

### Q3: 脚本会删除我的本地数据吗？

A: **不会**。脚本使用 `prisma migrate dev`，它会安全地应用迁移而不删除数据。

### Q4: 如果我想跳过 Git Hook 检查怎么办？

A: 使用 `--no-verify` 标志（不推荐）：

```bash
git commit --no-verify -m "your message"
```

**警告**：这样做可能导致生产环境部署失败！

### Q5: 生产环境部署失败了怎么办？

A: 检查 GitHub Actions 日志。通常是因为：

1. **没有迁移文件**：在开发环境创建迁移文件并推送
2. **迁移冲突**：手动解决迁移冲突
3. **数据库连接问题**：检查环境变量和数据库状态

### Q6: 如何查看迁移状态？

```bash
cd beichen33/backend
npx prisma migrate status
```

### Q7: 如何回滚迁移？

Prisma 不支持自动回滚。如果需要回滚：

1. 手动创建反向迁移文件
2. 或者恢复数据库备份

## 🔧 脚本参数

```bash
# 查看帮助
./prisma-auto-migrate.sh --help

# 强制创建迁移
./prisma-auto-migrate.sh --force

# 正常模式（自动检查）
./prisma-auto-migrate.sh
```

## 📁 文件结构

```
beichenoa/
├── prisma-auto-migrate.sh          # 自动迁移脚本
├── .git/hooks/pre-commit           # Git 钩子（自动创建）
├── .github/workflows/deploy.yml    # GitHub Actions（已更新）
└── beichen33/backend/
    └── prisma/
        ├── schema.prisma           # 数据库 Schema
        └── migrations/             # 迁移文件目录
            ├── 20251121_120000_initial/
            ├── 20251121_130000_add_users/
            └── migration_lock.toml
```

## 🎯 最佳实践

1. **每次修改 Schema 后立即创建迁移**
   ```bash
   # 修改 schema.prisma 后
   ./prisma-auto-migrate.sh
   ```

2. **使用有意义的迁移名称**
   ```bash
   # 自动生成的名称包含时间戳
   # auto_20251121_130000
   ```

3. **提交前检查迁移文件**
   ```bash
   git status
   # 确保 prisma/migrations 目录在提交中
   ```

4. **定期备份生产数据库**
   - 在重大变更前备份数据库
   - 使用 PostgreSQL 的 `pg_dump` 等工具

5. **测试迁移**
   - 在开发环境测试迁移
   - 确保迁移可以正常应用
   - 检查数据完整性

## 🚨 注意事项

### ⚠️ 开发环境

- 修改 Schema 后**必须**创建迁移文件
- 不要直接使用 `prisma db push`（它不创建迁移文件）
- 始终提交迁移文件到 Git

### ⚠️ 生产环境

- **永远不要**在生产环境手动修改数据库结构
- **永远不要**在生产环境运行 `prisma db push`
- 所有变更必须通过迁移文件

### ⚠️ 团队协作

- 拉取代码后运行 `npx prisma migrate deploy` 应用其他人的迁移
- 或者使用脚本：`cd beichen33/backend && npx prisma migrate dev`
- 解决迁移冲突时与团队沟通

## 📞 遇到问题？

如果遇到任何问题：

1. 查看 GitHub Actions 日志
2. 运行 `npx prisma migrate status` 检查迁移状态
3. 检查数据库连接和环境变量
4. 查看 Prisma 官方文档：https://www.prisma.io/docs/concepts/components/prisma-migrate

## 🎉 总结

现在你有了一个**完整的自动化迁移系统**：

- ✅ 自动检测 Schema 变更
- ✅ 自动创建迁移文件
- ✅ Git 提交前检查
- ✅ 生产环境自动部署
- ✅ 保护本地开发数据
- ✅ 防止 Schema 与数据库不一致

**只需记住：修改 Schema 后运行 `./prisma-auto-migrate.sh`！**
