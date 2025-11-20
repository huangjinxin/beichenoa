# 部署指南

本项目提供了两种部署方式：Docker 部署和传统 PM2 部署。

## 目录

- [Docker 部署（推荐）](#docker-部署推荐)
- [PM2 部署](#pm2-部署)
- [服务器部署注意事项](#服务器部署注意事项)
- [常见问题](#常见问题)

---

## Docker 部署（推荐）

### 前提条件

- Docker 已安装
- Docker Compose 已安装
- Git 已配置

### 使用方法

```bash
# 1. 克隆或拉取代码
git clone <repository-url>
cd beichen33

# 2. 运行部署脚本
./deploy.sh
```

### 脚本功能

`deploy.sh` 会自动执行以下操作：

1. ✅ 检查部署环境（Docker、Git）
2. ✅ 从 GitHub 拉取最新代码
3. ✅ 检测并应用数据库迁移
4. ✅ 清理旧的构建文件
5. ✅ 重新构建 Docker 镜像
6. ✅ 重新生成 Prisma Client
7. ✅ 重启所有服务
8. ✅ 执行健康检查

### 手动操作

如果需要手动部署：

```bash
# 拉取代码
git pull origin main

# 应用数据库迁移（重要！）
docker-compose exec backend npx prisma migrate deploy
# 或手动执行 SQL
docker exec beichen33-postgres-1 psql -U postgres -d kindergarten < backend/prisma/migrations/xxx/migration.sql

# 重新构建并启动
docker-compose build backend frontend
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启单个服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 进入容器
docker exec -it beichen33-backend-1 sh
docker exec -it beichen33-postgres-1 psql -U postgres -d kindergarten
```

---

## PM2 部署

### 前提条件

- Node.js 16+ 已安装
- PM2 已全局安装（`npm install -g pm2`）
- PostgreSQL 数据库已配置
- Git 已配置

### 环境变量配置

创建 `backend/.env` 文件：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kindergarten?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=8891
```

### 使用方法

```bash
# 1. 克隆或拉取代码
git clone <repository-url>
cd beichen33

# 2. 运行部署脚本
./deploy-pm2.sh
```

### 脚本功能

`deploy-pm2.sh` 会自动执行以下操作：

1. ✅ 检查部署环境（Node.js、npm、PM2）
2. ✅ 从 GitHub 拉取最新代码
3. ✅ 停止当前运行的服务
4. ✅ 清理缓存和 node_modules
5. ✅ 安装后端依赖（npm ci）
6. ✅ 应用数据库迁移
7. ✅ 重新生成 Prisma Client
8. ✅ 编译后端项目
9. ✅ 安装并编译前端项目
10. ✅ 启动或重启 PM2 服务

### 手动操作

```bash
# 拉取代码
git pull origin main

# 后端部署
cd backend
rm -rf dist node_modules
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build

# 前端部署
cd ../frontend
rm -rf dist node_modules
npm ci
npm run build

# 启动服务
cd ..
pm2 start ecosystem.config.js
# 或
pm2 restart beichen33

# 保存配置
pm2 save
```

### PM2 常用命令

```bash
# 查看状态
pm2 status
pm2 list

# 查看日志
pm2 logs beichen33-backend
pm2 logs beichen33-backend --lines 100

# 重启服务
pm2 restart beichen33-backend

# 停止服务
pm2 stop beichen33-backend

# 删除进程
pm2 delete beichen33-backend

# 监控
pm2 monit
```

---

## 服务器部署注意事项

### 1. IP 和域名配置

当前配置已支持多种访问方式：

- **内网 IP**: `http://192.168.88.228:8892`
- **域名**: `http://beichen.706tech.cn:8892`

前端配置（`frontend/vite.config.ts`）已设置：
- `host: true` - 接受所有主机名
- API 代理使用 Docker 服务名 `http://backend:8891`

无需修改即可支持 IP 和域名访问。

### 2. 数据库迁移

**重要**：每次 `git pull` 后检查是否有新的迁移：

```bash
# 查看迁移目录
ls -la backend/prisma/migrations/

# Docker 环境应用迁移
docker-compose exec backend npx prisma migrate deploy

# 或手动执行最新的迁移 SQL
LATEST_MIGRATION=$(ls -t backend/prisma/migrations | head -n 1)
docker exec beichen33-postgres-1 psql -U postgres -d kindergarten < \
  backend/prisma/migrations/$LATEST_MIGRATION/migration.sql
```

### 3. 数据持久化

Docker Compose 配置使用了命名卷 `postgres_data`，数据库数据会持久化保存。

即使删除容器，数据也不会丢失。如需完全清理：

```bash
# 警告：会删除所有数据！
docker-compose down -v
```

### 4. 端口映射

确保服务器防火墙开放以下端口：

- `8892` - 前端
- `8891` - 后端 API
- `5432` - PostgreSQL（可选，仅内网访问）

### 5. 环境变量

生产环境请修改：

```bash
# backend/.env 或 docker-compose.yml
JWT_SECRET=使用强随机密钥
DATABASE_URL=使用实际的数据库地址
```

### 6. Nginx 反向代理（可选）

如果使用域名访问，建议配置 Nginx：

```nginx
server {
    listen 80;
    server_name beichen.706tech.cn;

    # 前端
    location / {
        proxy_pass http://localhost:8892;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8891;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 常见问题

### 1. 部署后无法登录

**症状**：前端显示连接错误或 401

**解决**：
```bash
# 检查后端是否正常运行
docker-compose logs backend
# 或
pm2 logs beichen33-backend

# 重新运行 seed 创建初始用户
docker-compose exec backend npm run seed
# 或
cd backend && npm run seed
```

**登录凭据**：
- 邮箱: `admin@beichen.com`
- 密码: `admin123`

### 2. 数据库迁移失败

**症状**：提示列不存在或表不存在

**解决**：
```bash
# 查看当前迁移状态
docker-compose exec backend npx prisma migrate status

# 手动执行迁移
docker-compose exec backend npx prisma migrate deploy

# 如果仍然失败，检查数据库连接
docker-compose exec backend npx prisma migrate resolve --applied <migration-name>
```

### 3. 端口被占用

**症状**：Error: listen EADDRINUSE :::8891

**解决**：
```bash
# 查找占用端口的进程
lsof -i :8891
# 或
netstat -tulnp | grep 8891

# 停止占用进程
kill -9 <PID>

# 或修改端口
# 编辑 docker-compose.yml 或 .env 文件
```

### 4. Docker 容器一直重启

**症状**：`docker-compose ps` 显示 Restarting

**解决**：
```bash
# 查看容器日志找出原因
docker-compose logs backend

# 常见原因：
# - 数据库连接失败：检查 DATABASE_URL
# - 数据库迁移失败：手动执行迁移
# - 端口被占用：检查端口配置
```

### 5. Git pull 后服务报错

**原因**：可能有新的依赖或数据库变更

**解决**：
```bash
# 完整重新部署
./deploy.sh

# 或手动步骤
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

---

## 监控和日志

### Docker 环境

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 查看最近 100 行
docker-compose logs --tail=100 backend
```

### PM2 环境

```bash
# 实时查看日志
pm2 logs

# 查看特定应用日志
pm2 logs beichen33-backend

# 清空日志
pm2 flush

# 监控
pm2 monit
```

---

## 备份和恢复

### 数据库备份

```bash
# Docker 环境
docker exec beichen33-postgres-1 pg_dump -U postgres kindergarten > backup.sql

# 恢复
docker exec -i beichen33-postgres-1 psql -U postgres kindergarten < backup.sql
```

### 代码备份

```bash
# 打包整个项目（排除 node_modules）
tar -czf beichen33-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  beichen33/
```

---

## 支持

如有问题，请查看：
- 项目日志
- GitHub Issues
- 或联系开发团队
