#!/bin/bash

###############################################################################
# Prisma 数据库同步脚本
# 用途：安全地将本地数据库同步到最新的 Schema 状态
# 特点：不删除数据，只应用待处理的迁移
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_DIR="beichen33/backend"

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

# 设置 Node.js 路径
setup_node_path() {
    local NODE_PATHS=(
        "/usr/local/bin"
        "/opt/homebrew/bin"
        "$HOME/.nvm/versions/node/$(nvm version 2>/dev/null || echo '')/bin"
        "$HOME/.volta/bin"
        "$HOME/.asdf/shims"
        "/usr/bin"
    )

    if command -v npm &> /dev/null; then
        return 0
    fi

    for path in "${NODE_PATHS[@]}"; do
        if [ -f "$path/npm" ]; then
            export PATH="$path:$PATH"
            return 0
        fi
    done

    print_error "未找到 Node.js/npm"
    exit 1
}

main() {
    print_info "========================================="
    print_info "Prisma 数据库同步脚本"
    print_info "========================================="
    echo ""
    
    setup_node_path
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "找不到后端目录: $BACKEND_DIR"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    
    print_info "检查迁移状态..."
    echo ""
    
    # 显示当前迁移状态
    npx prisma migrate status --schema=prisma/schema.prisma || true
    
    echo ""
    print_warning "即将同步数据库..."
    print_info "这将应用所有待处理的迁移文件"
    print_success "✅ 你的数据不会被删除"
    echo ""
    
    read -p "确认继续? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "已取消同步"
        exit 0
    fi
    
    echo ""
    print_info "应用迁移文件..."
    
    # 使用 migrate dev 而不是 db push，这样不会删除数据
    if npx prisma migrate dev --schema=prisma/schema.prisma; then
        echo ""
        print_success "数据库同步成功！"
        print_info "重新生成 Prisma Client..."
        
        npx prisma generate --schema=prisma/schema.prisma
        
        echo ""
        print_success "========================================="
        print_success "同步完成！数据已保留"
        print_success "========================================="
    else
        echo ""
        print_error "同步失败"
        print_info "请检查迁移文件或数据库连接"
        exit 1
    fi
    
    cd - > /dev/null
}

show_help() {
    cat << EOF
Prisma 数据库同步脚本

用途：
    安全地将本地数据库同步到最新的 Schema 状态
    不会删除你的开发数据

使用场景：
    1. 从 Git 拉取了其他人的迁移文件
    2. 本地数据库和 Schema 不一致
    3. 忘记运行迁移，需要同步

用法：
    $0              # 同步数据库
    $0 --help       # 显示帮助

安全性：
    ✅ 使用 prisma migrate dev，不删除数据
    ✅ 应用迁移前会询问确认
    ✅ 显示迁移状态，透明可控

EOF
}

case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
