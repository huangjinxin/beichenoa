#!/bin/bash

###############################################################################
# Prisma 自动迁移脚本
# 用途：确保 Prisma Schema 变更自动创建迁移文件，避免生产环境部署失败
# 作者：Claude Code
# 日期：2025-11-21
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKEND_DIR="beichen33/backend"
SCHEMA_PATH="$BACKEND_DIR/prisma/schema.prisma"
MIGRATIONS_DIR="$BACKEND_DIR/prisma/migrations"

# 设置 Node.js 路径（兼容多种安装方式）
setup_node_path() {
    # 常见的 Node.js 安装路径
    local NODE_PATHS=(
        "/usr/local/bin"
        "/opt/homebrew/bin"
        "$HOME/.nvm/versions/node/$(nvm version 2>/dev/null || echo '')/bin"
        "$HOME/.volta/bin"
        "$HOME/.asdf/shims"
        "/usr/bin"
        "/opt/local/bin"
    )

    # 检查 npm 是否已在 PATH 中
    if command -v npm &> /dev/null; then
        print_success "Node.js 环境已配置: $(npm --version)"
        return 0
    fi

    # 尝试从常见路径中找到 npm
    for path in "${NODE_PATHS[@]}"; do
        if [ -f "$path/npm" ]; then
            export PATH="$path:$PATH"
            print_success "找到 Node.js: $path"
            return 0
        fi
    done

    print_error "未找到 Node.js/npm，请确保已安装 Node.js"
    print_info "尝试运行: brew install node 或访问 https://nodejs.org"
    exit 1
}

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否在正确的目录
check_directory() {
    if [ ! -f "$SCHEMA_PATH" ]; then
        print_error "找不到 Prisma Schema 文件: $SCHEMA_PATH"
        print_info "当前目录: $(pwd)"
        exit 1
    fi
    print_success "找到 Prisma Schema 文件"
}

# 检查 schema 是否有未迁移的变更
check_schema_changes() {
    print_info "检查 Schema 变更状态..."

    cd "$BACKEND_DIR"

    # 检查是否有待迁移的变更
    if npx prisma migrate status --schema=prisma/schema.prisma 2>&1 | grep -q "Database schema is up to date"; then
        print_success "数据库 Schema 已是最新状态"
        cd - > /dev/null
        return 1  # 没有变更
    else
        print_warning "检测到 Schema 变更，需要创建迁移文件"
        cd - > /dev/null
        return 0  # 有变更
    fi
}

# 开发环境：创建并应用迁移
dev_migrate() {
    print_info "========================================="
    print_info "开发环境模式：创建迁移文件"
    print_info "========================================="

    cd "$BACKEND_DIR"

    # 生成迁移文件名（基于时间戳）
    MIGRATION_NAME="auto_$(date +%Y%m%d_%H%M%S)"

    print_info "迁移名称: $MIGRATION_NAME"
    print_warning "即将运行 prisma migrate dev..."
    print_warning "这将："
    print_warning "  1. 创建新的迁移文件"
    print_warning "  2. 应用到你的开发数据库"
    print_warning "  3. 重新生成 Prisma Client"
    echo ""

    # 运行迁移
    if npx prisma migrate dev --name "$MIGRATION_NAME" --schema=prisma/schema.prisma; then
        print_success "迁移文件已创建并应用成功！"
        print_success "迁移文件位置: $MIGRATIONS_DIR"

        # 提示用户提交迁移文件
        echo ""
        print_warning "⚠️  重要提示："
        print_warning "请将新创建的迁移文件提交到 Git："
        echo ""
        echo -e "${YELLOW}  git add $BACKEND_DIR/prisma/migrations${NC}"
        echo -e "${YELLOW}  git commit -m \"feat: add prisma migration $MIGRATION_NAME\"${NC}"
        echo -e "${YELLOW}  git push${NC}"
        echo ""

        cd - > /dev/null
        return 0
    else
        print_error "迁移创建失败"
        cd - > /dev/null
        return 1
    fi
}

# 主函数
main() {
    print_info "========================================="
    print_info "Prisma 自动迁移脚本（开发环境专用）"
    print_info "========================================="
    echo ""

    # 设置 Node.js 环境
    setup_node_path

    # 检查目录
    check_directory

    # 注意：生产环境的迁移由 Docker 容器自动处理（见 docker-compose.yml）
    print_info "当前环境: 开发环境"
    print_info "生产环境迁移由 Docker 自动处理"
    echo ""

    # 开发环境：检查是否需要创建迁移
    if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
        # 强制创建迁移
        print_warning "强制创建迁移模式"
        dev_migrate
    else
        # 自动检查
        if check_schema_changes; then
            # 有变更，询问是否创建迁移
            echo ""
            print_warning "检测到 Schema 变更！"
            read -p "是否创建迁移文件? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                dev_migrate
            else
                print_warning "已跳过迁移创建"
                print_error "警告：如果不创建迁移文件，Docker 容器启动时将会失败！"
                exit 1
            fi
        else
            print_success "无需创建迁移文件"
        fi
    fi

    echo ""
    print_success "========================================="
    print_success "脚本执行完成"
    print_success "========================================="
}

# 显示帮助信息
show_help() {
    cat << EOF
Prisma 自动迁移脚本（开发环境专用）

用法:
    $0 [选项]

选项:
    -f, --force     强制创建迁移文件（跳过检查）
    -h, --help      显示此帮助信息

功能:
    - 检查 Prisma Schema 变更并创建迁移文件
    - 自动应用迁移到本地开发数据库
    - 提醒你提交迁移文件到 Git

注意:
    - 生产环境的迁移由 Docker 容器自动处理（见 beichen33/docker-compose.yml）
    - 每次修改 schema.prisma 后都应该运行此脚本

示例:
    # 修改 schema.prisma 后运行（推荐）
    $0

    # 强制创建迁移（跳过检查）
    $0 --force

    # 显示帮助信息
    $0 --help

EOF
}

# 处理命令行参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
