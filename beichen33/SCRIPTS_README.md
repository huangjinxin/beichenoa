# 服务管理脚本说明

## 可用脚本

### 1. 启动脚本 - `./start.sh`
一键启动所有服务（会重新构建镜像以确保所有修改生效）

```bash
./start.sh
```

功能：
- 停止并清理旧容器
- 重新构建 Docker 镜像
- 启动所有服务（PostgreSQL、后端、前端）
- 检查服务健康状态
- 显示服务访问地址和日志命令

### 2. 停止脚本 - `./stop.sh`
一键停止所有服务

```bash
./stop.sh
```

功能：
- 显示当前运行的容器
- 停止所有服务
- 提供额外的清理选项说明

### 3. 重启管理脚本 - `./restart.sh`
交互式菜单，提供多种重启和监控选项

```bash
./restart.sh
```

功能选项：
1. **快速重启** - 不重新构建镜像，仅重启服务
2. **完全重启** - 重新构建镜像并启动服务
3. **自动监控** - 持续监控后端服务，自动重启失败的服务
4. **查看日志** - 显示所有服务的最近日志
5. **退出**

## 服务访问地址

- 前端：http://localhost:8892
- 后端：http://localhost:8891
- 数据库：localhost:5432

## 常用命令

### 查看日志
```bash
# 实时查看后端日志
docker logs -f beichen33-backend-1

# 实时查看前端日志
docker logs -f beichen33-frontend-1

# 实时查看数据库日志
docker logs -f beichen33-postgres-1

# 查看所有服务日志
docker-compose logs -f
```

### 查看服务状态
```bash
docker-compose ps
```

### 进入容器
```bash
# 进入后端容器
docker exec -it beichen33-backend-1 sh

# 进入前端容器
docker exec -it beichen33-frontend-1 sh

# 进入数据库容器
docker exec -it beichen33-postgres-1 sh
```

### 手动重启单个服务
```bash
# 重启后端
docker-compose restart backend

# 重启前端
docker-compose restart frontend

# 重启数据库
docker-compose restart postgres
```

## 自动重启策略

系统已配置 `restart: unless-stopped` 策略，这意味着：
- 容器退出时会自动重启
- 手动停止的容器不会自动重启
- Docker 守护进程重启后容器会自动启动

## 故障排除

### 1. 登录失败 / ECONNRESET 错误
通常是后端服务未正常启动，检查步骤：
```bash
# 查看后端日志
docker logs --tail 50 beichen33-backend-1

# 如果看到 bcrypt 相关错误，重新构建服务
./start.sh
```

### 2. 端口被占用
```bash
# 检查端口占用
lsof -i :8891
lsof -i :8892
lsof -i :5432

# 停止占用端口的进程或修改 docker-compose.yml 中的端口映射
```

### 3. 数据库连接失败
```bash
# 检查数据库是否健康
docker ps | grep postgres

# 检查数据库日志
docker logs beichen33-postgres-1

# 重启数据库
docker-compose restart postgres
```

### 4. 清理并重新开始
```bash
# 停止所有服务并删除容器
docker-compose down

# 停止所有服务并删除数据卷（会清空数据库）
docker-compose down -v

# 完全清理（包括镜像）
docker-compose down -v --rmi all

# 然后重新启动
./start.sh
```

## 注意事项

1. **首次启动**可能需要较长时间，因为需要下载镜像和安装依赖
2. **数据持久化**：数据库数据存储在 Docker volume 中，删除容器不会丢失数据
3. **代码修改**：由于使用了 volume 映射，修改代码后会自动生效（热重载）
4. **网络问题**：如果构建失败提示网络超时，请检查网络连接或稍后重试

## 开发环境配置

默认配置：
- 数据库用户：postgres
- 数据库密码：postgres
- 数据库名：kindergarten
- JWT密钥：your-secret-key-change-in-production（生产环境请修改）

如需修改，请编辑 `docker-compose.yml` 中的环境变量。
