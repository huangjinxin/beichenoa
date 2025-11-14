#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  北辰幼儿园管理系统 - 停止脚本${NC}"
echo -e "${YELLOW}======================================${NC}"

# 显示当前运行的容器
echo -e "\n${YELLOW}当前运行的容器:${NC}"
docker-compose ps

# 停止所有服务
echo -e "\n${YELLOW}正在停止所有服务...${NC}"
docker-compose down

# 确认停止
echo -e "\n${GREEN}======================================${NC}"
if [ "$(docker-compose ps -q)" ]; then
    echo -e "${RED}✗ 部分服务未能停止${NC}"
    docker-compose ps
else
    echo -e "${GREEN}✓ 所有服务已成功停止${NC}"
fi
echo -e "${GREEN}======================================${NC}\n"

# 提示清理选项
echo -e "${YELLOW}其他清理选项:${NC}"
echo -e "  停止并删除所有数据卷: ${RED}docker-compose down -v${NC}"
echo -e "  停止并删除所有镜像: ${RED}docker-compose down --rmi all${NC}"
echo -e "  完全清理(包含数据): ${RED}docker-compose down -v --rmi all${NC}\n"
