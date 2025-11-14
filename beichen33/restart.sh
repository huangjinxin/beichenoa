#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  自动重启监控脚本${NC}"
echo -e "${BLUE}======================================${NC}"

# 自动重启函数
auto_restart() {
    local SERVICE_NAME=$1
    local CHECK_INTERVAL=10
    local MAX_RETRIES=3
    local retry_count=0

    echo -e "${YELLOW}开始监控服务: ${SERVICE_NAME}${NC}"

    while true; do
        # 检查容器是否在运行
        if ! docker ps | grep -q "${SERVICE_NAME}"; then
            retry_count=$((retry_count + 1))
            echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 检测到 ${SERVICE_NAME} 已停止 (尝试 ${retry_count}/${MAX_RETRIES})${NC}"

            if [ $retry_count -le $MAX_RETRIES ]; then
                echo -e "${YELLOW}正在重启 ${SERVICE_NAME}...${NC}"
                docker-compose restart ${SERVICE_NAME}
                sleep 5

                if docker ps | grep -q "${SERVICE_NAME}"; then
                    echo -e "${GREEN}✓ ${SERVICE_NAME} 重启成功${NC}"
                    retry_count=0
                else
                    echo -e "${RED}✗ ${SERVICE_NAME} 重启失败${NC}"
                fi
            else
                echo -e "${RED}已达到最大重试次数，请检查服务日志${NC}"
                docker logs --tail 30 ${SERVICE_NAME}
                retry_count=0
            fi
        else
            # 检查后端服务是否正常响应
            if [ "${SERVICE_NAME}" == "backend" ]; then
                if ! docker logs beichen33-backend-1 2>&1 | tail -20 | grep -q "Nest application successfully started"; then
                    if docker logs beichen33-backend-1 2>&1 | tail -20 | grep -q "Error"; then
                        echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 检测到 ${SERVICE_NAME} 有错误${NC}"
                        retry_count=$((retry_count + 1))

                        if [ $retry_count -le $MAX_RETRIES ]; then
                            echo -e "${YELLOW}正在重启 ${SERVICE_NAME}...${NC}"
                            docker-compose restart ${SERVICE_NAME}
                            sleep 5
                            retry_count=0
                        fi
                    fi
                fi
            fi
        fi

        sleep $CHECK_INTERVAL
    done
}

# 快速重启函数（不重新构建）
quick_restart() {
    echo -e "${YELLOW}======================================${NC}"
    echo -e "${YELLOW}  快速重启所有服务${NC}"
    echo -e "${YELLOW}======================================${NC}"

    docker-compose restart

    echo -e "\n${YELLOW}等待服务启动...${NC}"
    sleep 5

    echo -e "\n${GREEN}服务状态:${NC}"
    docker-compose ps
}

# 完全重启函数（重新构建）
full_restart() {
    echo -e "${YELLOW}======================================${NC}"
    echo -e "${YELLOW}  完全重启（重新构建）${NC}"
    echo -e "${YELLOW}======================================${NC}"

    ./start.sh
}

# 主菜单
show_menu() {
    echo -e "\n${GREEN}请选择操作:${NC}"
    echo -e "  ${YELLOW}1${NC} - 快速重启所有服务（不重新构建）"
    echo -e "  ${YELLOW}2${NC} - 完全重启（重新构建镜像）"
    echo -e "  ${YELLOW}3${NC} - 启动自动监控并重启后端服务"
    echo -e "  ${YELLOW}4${NC} - 查看所有服务日志"
    echo -e "  ${YELLOW}5${NC} - 退出"
    echo -e "\n${GREEN}请输入选项 [1-5]:${NC} "
}

# 主循环
while true; do
    show_menu
    read -r choice

    case $choice in
        1)
            quick_restart
            ;;
        2)
            full_restart
            ;;
        3)
            echo -e "${YELLOW}按 Ctrl+C 停止监控${NC}"
            auto_restart "backend"
            ;;
        4)
            echo -e "${GREEN}显示最近50行日志...${NC}"
            echo -e "\n${BLUE}=== 后端日志 ===${NC}"
            docker logs --tail 50 beichen33-backend-1
            echo -e "\n${BLUE}=== 前端日志 ===${NC}"
            docker logs --tail 50 beichen33-frontend-1
            ;;
        5)
            echo -e "${GREEN}退出脚本${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项，请重新选择${NC}"
            ;;
    esac
done
