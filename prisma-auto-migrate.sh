#!/bin/bash

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE} 🔧 Prisma 一键迁移执行工具（自动强制流程） ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 进入 backend
if [ ! -d "beichen33/backend" ]; then
    echo -e "${RED}❌ 找不到 beichen33/backend 目录！${NC}"
    exit 1
fi

cd beichen33/backend

echo -e "${BLUE}📌 当前目录：${NC}$(pwd)"

# 生成迁移
MIGRATION_NAME="auto_$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}🚀 正在自动生成迁移文件：${NC}${GREEN}${MIGRATION_NAME}${NC}"

if npx prisma migrate dev --name "$MIGRATION_NAME"; then
    echo -e "${GREEN}✅ Prisma 迁移成功${NC}"
else
    echo -e "${RED}❌ Prisma 迁移失败，请检查 schema.prisma！${NC}"
    exit 1
fi

# 添加迁移文件
echo -e "${BLUE}📦 正在加入 Git 暂存区：prisma/migrations/${NC}"
git add prisma/

cd ../..

echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}✔ 已完成 Prisma 按规范迁移的全部流程${NC}"
echo -e "${GREEN}✔ 现在你可以运行： ./force-push.sh${NC}"
echo -e "${GREEN}==============================================${NC}"
