# Beichen Kindergarten Management System

## Tech Stack

### Backend
- NestJS (TypeScript)
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Swagger API Documentation

### Frontend
- React 18
- TypeScript
- Vite
- Ant Design 5.x
- Zustand (State Management)
- TanStack Query (Data Fetching)

## Project Structure

```
beichen33/
├── backend/              # NestJS backend
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── modules/     # Feature modules
│   │   ├── common/      # Shared utilities
│   │   └── config/      # Configuration
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API services
│   │   └── store/       # State management
│   └── package.json
└── docker-compose.yml   # Docker configuration
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

Services:
- Backend API: http://localhost:8891
- Frontend: http://localhost:8892
- API Documentation: http://localhost:8891/api
- PostgreSQL: localhost:5432

### Manual Setup

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Database Migration

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

## Default Credentials

After seeding, use these credentials:
- Email: admin@beichen.com
- Password: admin123

⚠️ **重要**: 生产环境请立即修改默认密码！

## Features

1. Student Management
   - Student profiles
   - Growth records
   - Health tracking

2. Class Management
   - Class organization
   - Teacher assignment
   - Student allocation

3. Canteen Management
   - Ingredient database
   - Dish management
   - Menu planning
   - Nutrition analysis

4. Form System
   - Dynamic form templates
   - Form submissions
   - Approval workflows

5. Reports & Statistics
   - Student statistics
   - Growth trends
   - Nutrition reports

## API Documentation

Swagger documentation available at: http://localhost:8891/api

## Ports

- Backend: 8891
- Frontend: 8892
- PostgreSQL: 5432

## 🚀 部署到生产环境

### 一键部署

项目提供了自动化部署脚本，支持两种部署方式：

#### Docker 部署（推荐）
```bash
chmod +x deploy.sh
./deploy.sh
```

#### PM2 部署
```bash
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

### 部署脚本功能

- ✅ 自动拉取最新代码
- ✅ 应用数据库迁移
- ✅ 清理缓存和旧文件
- ✅ 重新安装依赖
- ✅ 编译项目
- ✅ 重启服务
- ✅ 健康检查

### 服务器访问

- **内网 IP**: http://192.168.88.228:8892
- **域名**: http://beichen.706tech.cn:8892

配置已支持 IP 和域名访问，无需修改。

### 详细文档

- 📖 [完整部署指南](./DEPLOYMENT.md)
- 📋 [快速部署参考](./QUICK_DEPLOY.md)
- 🧪 [测试指南](./TEST_GUIDE.md)

### 部署后检查

```bash
# Docker 环境
docker-compose ps
docker-compose logs backend

# PM2 环境
pm2 status
pm2 logs
```

## 📦 项目文件说明

- `deploy.sh` - Docker 自动部署脚本
- `deploy-pm2.sh` - PM2 自动部署脚本
- `ecosystem.config.js` - PM2 配置文件
- `docker-compose.yml` - Docker Compose 配置
- `DEPLOYMENT.md` - 详细部署指南
- `QUICK_DEPLOY.md` - 快速部署参考
