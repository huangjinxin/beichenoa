# 快速部署参考

## 🚀 一键部署

### Docker 部署（推荐）

```bash
./deploy.sh
```

### PM2 部署

```bash
./deploy-pm2.sh
```

---

## 📋 部署前检查清单

- [ ] Git 配置正确
- [ ] 数据库连接正常
- [ ] 端口未被占用（8891, 8892, 5432）
- [ ] Docker/PM2 已安装
- [ ] 环境变量已配置

---

## 🔑 默认登录凭据

- **邮箱**: `admin@beichen.com`
- **密码**: `admin123`

⚠️ 生产环境请立即修改默认密码！

---

## 🌐 访问地址

### 本地开发
- 前端: http://localhost:8892
- 后端: http://localhost:8891
- API 文档: http://localhost:8891/api-docs

### 服务器部署
- 内网 IP: http://192.168.88.228:8892
- 域名: http://beichen.706tech.cn:8892

---

## 🐛 快速问题排查

### 无法登录
```bash
# 重新运行 seed
docker-compose exec backend npm run seed
```

### 数据库错误
```bash
# 应用迁移
docker-compose exec backend npx prisma migrate deploy
```

### 服务不启动
```bash
# 查看日志
docker-compose logs backend
docker-compose logs frontend
```

### 端口被占用
```bash
# 查找占用进程
lsof -i :8891
lsof -i :8892

# 停止进程
kill -9 <PID>
```

---

## 📊 常用命令

### Docker

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend

# 停止所有
docker-compose down

# 完全重建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### PM2

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启
pm2 restart beichen33-backend

# 停止
pm2 stop beichen33-backend

# 监控
pm2 monit
```

---

## 🔄 部署流程图

```
1. git pull          → 拉取最新代码
2. 检查迁移           → 应用数据库变更
3. 清理缓存           → 删除旧文件
4. 安装依赖/构建镜像  → 准备运行环境
5. 编译项目           → 生成生产代码
6. 重启服务           → 应用新版本
7. 健康检查           → 验证部署成功
```

---

## ⚙️ 环境变量配置

### Docker 环境（docker-compose.yml）
```yaml
environment:
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/kindergarten
  JWT_SECRET: your-secret-key-change-in-production
  PORT: 8891
```

### PM2 环境（backend/.env）
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kindergarten?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=8891
```

---

## 📝 更新日志

### 最新迁移: 20251119_sync_all_changes
- ✅ 添加银行信息字段（bankAccount, bankName, workplace）
- ✅ 添加采购计划、供应商等新表
- ✅ 完善审批流程字段

---

## 📞 获取帮助

详细文档请查看：
- [完整部署指南](./DEPLOYMENT.md)
- [项目文档](./README.md)
- [测试指南](./TEST_GUIDE.md)

遇到问题？检查日志：
```bash
docker-compose logs backend --tail=100
```
