#!/bin/bash

# ================================================================
# 北辰幼儿园管理系统 - PM2 部署脚本
# ================================================================
# 使用方法：
#   chmod +x deploy-pm2.sh
#   ./deploy-pm2.sh
# ================================================================
# 注意：这个脚本用于传统的 PM2 部署，如果使用 Docker，请用 deploy.sh
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

separator() {
    echo "================================================================"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

error_exit() {
    log_error "$1"
    exit 1
}

main() {
    separator
    log_info "开始部署北辰幼儿园管理系统 (PM2 模式)..."
    separator
    echo ""

    # 1. 检查环境
    log_info "步骤 1/9: 检查部署环境..."

    if ! command_exists git; then
        error_exit "Git 未安装"
    fi
    if ! command_exists node; then
        error_exit "Node.js 未安装"
    fi
    if ! command_exists npm; then
        error_exit "npm 未安装"
    fi
    if ! command_exists pm2; then
        log_warning "PM2 未安装，尝试全局安装..."
        npm install -g pm2 || error_exit "PM2 安装失败"
    fi

    log_success "环境检查完成"
    log_info "Node 版本: $(node -v)"
    log_info "npm 版本: $(npm -v)"
    log_info "PM2 版本: $(pm2 -v)"
    echo ""

    # 2. Git pull
    log_info "步骤 2/9: 从 GitHub 拉取最新代码..."

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $CURRENT_BRANCH"

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

    git pull origin "$CURRENT_BRANCH" || error_exit "Git pull 失败"
    log_success "代码更新完成"
    echo ""

    # 3. 停止 PM2 服务
    log_info "步骤 3/9: 停止当前运行的服务..."

    if pm2 list | grep -q beichen33; then
        pm2 stop beichen33 || log_warning "停止服务失败，可能服务未运行"
        log_success "服务已停止"
    else
        log_info "未发现运行中的服务"
    fi
    echo ""

    # 4. 清理缓存
    log_info "步骤 4/9: 清理缓存和构建文件..."

    # 清理 backend
    cd backend
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已删除 backend/dist"
    fi
    if [ -d "node_modules" ]; then
        log_info "删除旧的 node_modules..."
        rm -rf node_modules
    fi
    cd ..

    # 清理 frontend
    cd frontend
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已删除 frontend/dist"
    fi
    if [ -d "node_modules" ]; then
        log_info "删除旧的 node_modules..."
        rm -rf node_modules
    fi
    cd ..

    log_success "清理完成"
    echo ""

    # 5. 安装后端依赖
    log_info "步骤 5/9: 安装后端依赖..."

    cd backend
    npm ci || error_exit "后端依赖安装失败"
    log_success "后端依赖安装完成"
    cd ..
    echo ""

    # 6. Prisma 操作
    log_info "步骤 6/9: 处理数据库迁移和生成 Prisma Client..."

    cd backend

    # 应用迁移
    log_info "应用数据库迁移..."
    npx prisma migrate deploy || log_warning "迁移应用失败，请检查数据库连接"

    # 生成 Prisma Client
    log_info "生成 Prisma Client..."
    npx prisma generate || error_exit "Prisma Client 生成失败"

    log_success "Prisma 操作完成"
    cd ..
    echo ""

    # 7. 编译后端
    log_info "步骤 7/9: 编译后端项目..."

    cd backend
    npm run build || error_exit "后端编译失败"
    log_success "后端编译完成"
    cd ..
    echo ""

    # 8. 安装并编译前端
    log_info "步骤 8/9: 安装并编译前端项目..."

    cd frontend
    npm ci || error_exit "前端依赖安装失败"
    npm run build || error_exit "前端编译失败"
    log_success "前端编译完成"
    cd ..
    echo ""

    # 9. 启动服务
    log_info "步骤 9/9: 启动服务..."

    # 启动或重启 PM2 服务
    if pm2 list | grep -q beichen33; then
        log_info "重启现有的 PM2 进程..."
        pm2 restart beichen33 || error_exit "服务重启失败"
    else
        log_info "首次启动，创建 PM2 进程..."

        # 如果有 ecosystem.config.js，使用它
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js || error_exit "服务启动失败"
        else
            # 否则直接启动 backend
            cd backend
            pm2 start dist/main.js --name beichen33 || error_exit "服务启动失败"
            cd ..
        fi
    fi

    # 保存 PM2 配置
    pm2 save

    log_success "服务启动完成"
    echo ""

    # 10. 显示状态
    separator
    log_info "服务状态："
    separator
    pm2 list
    echo ""

    log_info "查看日志："
    echo "  pm2 logs beichen33"
    echo ""

    log_info "其他常用命令："
    echo "  - 查看状态: pm2 status"
    echo "  - 停止服务: pm2 stop beichen33"
    echo "  - 重启服务: pm2 restart beichen33"
    echo "  - 查看日志: pm2 logs beichen33"
    echo "  - 监控: pm2 monit"
    echo ""

    separator
    log_success "部署完成！"
    separator
    echo ""
}

trap 'log_error "部署过程中出现错误，已终止"; exit 1' ERR

main

exit 0
