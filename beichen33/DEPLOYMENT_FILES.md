# 部署文件清单

本文档列出了为北辰幼儿园管理系统创建的所有部署相关文件。

## 📁 文件列表

### 1. 部署脚本

#### `deploy.sh`
- **用途**: Docker 环境自动部署脚本
- **执行**: `./deploy.sh`
- **功能**:
  - ✅ Git pull 拉取代码
  - ✅ 应用数据库迁移
  - ✅ 清理缓存
  - ✅ 重新构建 Docker 镜像
  - ✅ 重启服务
  - ✅ 健康检查

#### `deploy-pm2.sh`
- **用途**: PM2 环境自动部署脚本
- **执行**: `./deploy-pm2.sh`
- **功能**:
  - ✅ Git pull 拉取代码
  - ✅ 停止服务
  - ✅ 清理 node_modules 和 dist
  - ✅ npm ci 安装依赖
  - ✅ Prisma migrate + generate
  - ✅ npm run build 编译
  - ✅ PM2 重启服务

### 2. 配置文件

#### `ecosystem.config.js`
- **用途**: PM2 进程管理配置
- **包含**:
  - Backend 应用配置
  - Frontend 应用配置（可选）
  - 日志配置
  - 重启策略

#### `.gitignore`
- **用途**: Git 忽略规则
- **排除**:
  - node_modules/
  - dist/
  - .env
  - 日志文件
  - IDE 配置

### 3. 文档

#### `DEPLOYMENT.md`
- **用途**: 完整的部署指南
- **内容**:
  - Docker 部署详细步骤
  - PM2 部署详细步骤
  - 服务器配置说明
  - 常见问题解答
  - 监控和日志
  - 备份和恢复

#### `QUICK_DEPLOY.md`
- **用途**: 快速部署参考卡片
- **内容**:
  - 一键命令
  - 检查清单
  - 默认凭据
  - 常用命令
  - 快速排查

#### `README.md` (已更新)
- **新增内容**:
  - 部署章节
  - 服务器访问地址
  - 文件说明
  - 修正登录凭据

### 4. 数据库迁移

#### `backend/prisma/migrations/20251119_sync_all_changes/`
- **用途**: 数据库结构同步迁移
- **包含**:
  - 添加 User 银行信息字段
  - 添加 Campus principalId
  - 创建新表（NutritionStandard, PurchasePlan, Supplier 等）
  - 添加 FormTemplate/FormSubmission 新字段
  - 添加索引和外键

## 📋 使用指南

### 首次部署

1. **选择部署方式**
   - Docker: `./deploy.sh`
   - PM2: `./deploy-pm2.sh`

2. **配置环境变量**
   - Docker: 编辑 `docker-compose.yml`
   - PM2: 创建 `backend/.env`

3. **运行部署脚本**
   ```bash
   chmod +x deploy.sh  # 或 deploy-pm2.sh
   ./deploy.sh
   ```

### 日常更新部署

```bash
# 拉取最新代码
git pull

# 运行部署脚本
./deploy.sh  # 或 ./deploy-pm2.sh
```

### 手动部署

参考 `DEPLOYMENT.md` 中的详细步骤。

## 🔍 文件依赖关系

```
deploy.sh
├── docker-compose.yml (读取配置)
├── backend/prisma/migrations/ (应用迁移)
└── DEPLOYMENT.md (参考文档)

deploy-pm2.sh
├── ecosystem.config.js (PM2 配置)
├── backend/.env (环境变量)
├── backend/prisma/ (数据库)
└── DEPLOYMENT.md (参考文档)

ecosystem.config.js
└── PM2 进程管理

backend/prisma/migrations/20251119_sync_all_changes/
└── migration.sql (迁移脚本)
```

## 📊 部署流程

### Docker 流程
```
git pull → 检查迁移 → 清理缓存 → 构建镜像 →
重启服务 → 健康检查 → 完成
```

### PM2 流程
```
git pull → 停止服务 → 清理文件 → 安装依赖 →
应用迁移 → 生成 Prisma → 编译项目 →
启动服务 → 完成
```

## 🚨 重要提示

### 1. 数据库迁移
每次部署前确保：
- 检查 `backend/prisma/migrations/` 是否有新迁移
- 脚本会自动应用，但建议先备份数据库

### 2. 环境变量
生产环境必须修改：
- `JWT_SECRET` - 使用强随机密钥
- `DATABASE_URL` - 使用实际数据库地址

### 3. 默认密码
部署后立即修改默认管理员密码：
- Email: admin@beichen.com
- Password: admin123 (需修改)

### 4. 端口配置
确保防火墙开放：
- 8892 (前端)
- 8891 (后端)
- 5432 (数据库，仅内网)

### 5. Git 配置
服务器上需要配置 Git SSH 密钥或 HTTPS 凭据。

## 🔧 故障排除

### 部署脚本执行失败
```bash
# 查看详细日志
bash -x deploy.sh

# 检查脚本权限
ls -la deploy.sh
chmod +x deploy.sh
```

### 数据库迁移失败
```bash
# 查看迁移状态
docker-compose exec backend npx prisma migrate status

# 手动应用迁移
docker-compose exec backend npx prisma migrate deploy
```

### 服务启动失败
```bash
# Docker 环境
docker-compose logs backend

# PM2 环境
pm2 logs beichen33-backend
```

## 📞 获取帮助

- 📖 详细文档: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 📋 快速参考: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- 🧪 测试指南: [TEST_GUIDE.md](./TEST_GUIDE.md)
- 📝 主文档: [README.md](./README.md)

## ✅ 检查清单

部署前确认：
- [ ] Git 配置正确
- [ ] 环境变量已设置
- [ ] 数据库可访问
- [ ] 端口未被占用
- [ ] Docker/PM2 已安装
- [ ] 脚本有执行权限

部署后确认：
- [ ] 服务状态正常
- [ ] 可以访问前端
- [ ] 可以登录系统
- [ ] API 响应正常
- [ ] 数据库连接正常
- [ ] 日志无错误

## 📅 维护建议

- **每周**: 检查日志，清理旧日志文件
- **每月**: 备份数据库，检查磁盘空间
- **每季度**: 更新依赖，安全审计
- **重大更新前**: 完整备份，测试环境验证

## 🔄 版本历史

### v1.0 (2025-11-19)
- ✅ 创建 Docker 部署脚本
- ✅ 创建 PM2 部署脚本
- ✅ 添加数据库迁移
- ✅ 完善部署文档
- ✅ 修复登录问题
- ✅ 添加健康检查

---

**最后更新**: 2025-11-19
**维护者**: 开发团队
