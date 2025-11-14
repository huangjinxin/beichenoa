#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  北辰幼儿园管理系统 - 启动脚本${NC}"
echo -e "${GREEN}======================================${NC}"

# 检查是否有旧容器在运行
echo -e "\n${YELLOW}[1/4] 检查并清理旧容器...${NC}"
docker-compose down

# 重新构建镜像（确保所有更改都生效）
echo -e "\n${YELLOW}[2/4] 重新构建Docker镜像...${NC}"
docker-compose build --no-cache

# 启动所有服务
echo -e "\n${YELLOW}[3/4] 启动所有服务...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "\n${YELLOW}[4/4] 等待服务启动...${NC}"
sleep 5

# 检查服务状态
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}  服务状态检查${NC}"
echo -e "${GREEN}======================================${NC}"
docker-compose ps

# 检查后端健康状态
echo -e "\n${YELLOW}检查后端健康状态...${NC}"
sleep 3
if docker logs beichen33-backend-1 2>&1 | grep -q "Nest application successfully started"; then
    echo -e "${GREEN}✓ 后端服务启动成功${NC}"
else
    echo -e "${RED}✗ 后端服务可能未正常启动，查看日志：${NC}"
    docker logs --tail 20 beichen33-backend-1
fi

echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}  服务访问地址${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "前端: ${YELLOW}http://localhost:8892${NC}"
echo -e "后端: ${YELLOW}http://localhost:8891${NC}"
echo -e "数据库: ${YELLOW}localhost:5432${NC}"
echo -e "\n${GREEN}查看日志命令:${NC}"
echo -e "  后端: ${YELLOW}docker logs -f beichen33-backend-1${NC}"
echo -e "  前端: ${YELLOW}docker logs -f beichen33-frontend-1${NC}"
echo -e "  数据库: ${YELLOW}docker logs -f beichen33-postgres-1${NC}"
echo -e "${GREEN}======================================${NC}\n"
