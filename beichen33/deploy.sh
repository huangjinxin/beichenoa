#!/bin/bash

# ================================================================
# 北辰幼儿园管理系统 - 自动部署脚本
# ================================================================
# 使用方法：
#   chmod +x deploy.sh
#   ./deploy.sh
# ================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示分隔线
separator() {
    echo "================================================================"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 错误处理
error_exit() {
    log_error "$1"
    exit 1
}

# 主函数
main() {
    separator
    log_info "开始部署北辰幼儿园管理系统..."
    separator
    echo ""

    # 1. 检查必要的命令
    log_info "步骤 1/7: 检查部署环境..."
    if ! command_exists git; then
        error_exit "Git 未安装，请先安装 Git"
    fi
    if ! command_exists docker; then
        error_exit "Docker 未安装，请先安装 Docker"
    fi
    if ! command_exists docker-compose; then
        log_warning "docker-compose 命令未找到，尝试使用 'docker compose'"
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    log_success "环境检查完成"
    echo ""

    # 2. 拉取最新代码
    log_info "步骤 2/7: 从 GitHub 拉取最新代码..."

    # 保存当前分支
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $CURRENT_BRANCH"

    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warning "检测到未提交的更改"
        read -p "是否要暂存这些更改并继续? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git stash
            log_info "已暂存本地更改"
        else
            error_exit "部署已取消"
        fi
    fi

    # 拉取代码
    git pull origin "$CURRENT_BRANCH" || error_exit "Git pull 失败"
    log_success "代码更新完成"
    echo ""

    # 3. 检查并应用数据库迁移
    log_info "步骤 3/7: 检查数据库迁移..."

    # 检查是否有新的迁移文件
    if [ -d "backend/prisma/migrations" ]; then
        LATEST_MIGRATION=$(ls -t backend/prisma/migrations | grep -v migration_lock.toml | head -n 1)
        if [ -n "$LATEST_MIGRATION" ]; then
            log_info "发现最新迁移: $LATEST_MIGRATION"

            # 检查容器是否运行
            if $DOCKER_COMPOSE ps | grep -q postgres; then
                log_info "应用数据库迁移..."

                # 方法1: 使用 Prisma migrate deploy (推荐)
                $DOCKER_COMPOSE exec -T backend npx prisma migrate deploy || {
                    log_warning "自动迁移失败，尝试手动执行 SQL..."

                    # 方法2: 手动执行迁移 SQL
                    MIGRATION_SQL="backend/prisma/migrations/$LATEST_MIGRATION/migration.sql"
                    if [ -f "$MIGRATION_SQL" ]; then
                        log_info "执行迁移文件: $MIGRATION_SQL"
                        docker exec -i beichen33-postgres-1 psql -U postgres -d kindergarten < "$MIGRATION_SQL" || \
                            log_warning "迁移执行出现警告，但继续部署..."
                    fi
                }
                log_success "数据库迁移完成"
            else
                log_warning "数据库容器未运行，将在容器启动时自动应用迁移"
            fi
        else
            log_info "没有检测到新的迁移文件"
        fi
    fi
    echo ""

    # 4. 清理缓存和旧文件
    log_info "步骤 4/7: 清理缓存和构建文件..."

    # 清理 backend
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        log_info "已删除 backend/dist"
    fi

    # 清理 frontend（Vite 构建的产物在容器内，这里清理本地的）
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log_info "已删除 frontend/dist"
    fi

    log_success "清理完成"
    echo ""

    # 5. 重新构建镜像
    log_info "步骤 5/7: 重新构建 Docker 镜像..."

    # 询问是否需要完全重新构建
    read -p "是否需要完全重新构建镜像（包括重新安装依赖）? (y/n) [默认 n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "完全重新构建镜像（不使用缓存）..."
        $DOCKER_COMPOSE build --no-cache backend frontend || error_exit "镜像构建失败"
    else
        log_info "使用缓存重新构建镜像..."
        $DOCKER_COMPOSE build backend frontend || error_exit "镜像构建失败"
    fi

    log_success "镜像构建完成"
    echo ""

    # 6. 重新生成 Prisma Client
    log_info "步骤 6/7: 重新生成 Prisma Client..."

    # 在容器内重新生成
    $DOCKER_COMPOSE exec -T backend npx prisma generate || {
        log_warning "容器内生成失败，尝试在容器启动时自动生成..."
    }

    log_success "Prisma Client 生成完成"
    echo ""

    # 7. 重启服务
    log_info "步骤 7/7: 重启服务..."

    # 停止服务
    log_info "停止当前服务..."
    $DOCKER_COMPOSE down || log_warning "停止服务时出现警告"

    # 启动服务
    log_info "启动服务..."
    $DOCKER_COMPOSE up -d || error_exit "服务启动失败"

    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10

    # 检查服务状态
    log_info "检查服务状态..."
    $DOCKER_COMPOSE ps

    log_success "服务重启完成"
    echo ""

    # 8. 健康检查
    separator
    log_info "执行健康检查..."
    separator

    # 检查 backend
    BACKEND_URL="http://localhost:8891/api/health"
    if command_exists curl; then
        sleep 5  # 等待服务完全启动
        if curl -s -f "$BACKEND_URL" > /dev/null 2>&1; then
            log_success "Backend 服务健康检查通过"
        else
            log_warning "Backend 服务健康检查失败，请查看日志: docker-compose logs backend"
        fi
    fi

    # 显示最新日志
    echo ""
    log_info "最近的服务日志："
    separator
    $DOCKER_COMPOSE logs --tail=20 backend

    # 完成
    echo ""
    separator
    log_success "部署完成！"
    separator
    echo ""
    log_info "访问地址："
    echo "  - 前端: http://localhost:8892"
    echo "  - 后端: http://localhost:8891"
    echo "  - API 文档: http://localhost:8891/api-docs"
    echo ""
    log_info "常用命令："
    echo "  - 查看日志: $DOCKER_COMPOSE logs -f"
    echo "  - 查看状态: $DOCKER_COMPOSE ps"
    echo "  - 停止服务: $DOCKER_COMPOSE down"
    echo "  - 重启服务: $DOCKER_COMPOSE restart"
    echo ""
}

# 捕获错误
trap 'log_error "部署过程中出现错误，已终止"; exit 1' ERR

# 执行主函数
main

exit 0
