#!/bin/bash

###############################################################################
# 数据库完全重置脚本
# 用途：删除所有数据和迁移历史，重新开始
# 适用场景：开发早期，Schema 频繁变更
# 警告：会删除所有数据！
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 配置
BACKEND_DIR="beichen33/backend"
MIGRATIONS_DIR="$BACKEND_DIR/prisma/migrations"

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}=========================================${NC}"
    echo -e "${BOLD}${BLUE}  数据库完全重置脚本${NC}"
    echo -e "${BOLD}${BLUE}=========================================${NC}"
    echo ""
}

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

print_step() {
    echo ""
    echo -e "${BOLD}${BLUE}>>> $1${NC}"
}

# 检查是否在正确的目录
check_directory() {
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "找不到后端目录: $BACKEND_DIR"
        print_info "当前目录: $(pwd)"
        print_info "请在项目根目录（beichenoa/）运行此脚本"
        exit 1
    fi
    print_success "找到后端目录"
}

# 检查环境
check_environment() {
    if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
        print_error "不能在 CI 环境中运行此脚本！"
        exit 1
    fi

    # 检测是生产还是开发环境
    if [ -f "$BACKEND_DIR/.env" ]; then
        if grep -q "production" "$BACKEND_DIR/.env" 2>/dev/null; then
            echo "production"
        else
            echo "development"
        fi
    else
        echo "development"
    fi
}

# 显示警告和确认
show_warning() {
    local env=$1

    echo ""
    print_warning "⚠️  ⚠️  ⚠️  警告 ⚠️  ⚠️  ⚠️"
    echo ""
    echo -e "${YELLOW}此操作将：${NC}"
    echo -e "${RED}  1. 删除所有迁移文件${NC}"
    echo -e "${RED}  2. 删除所有数据库数据${NC}"
    echo -e "${RED}  3. 创建全新的迁移${NC}"
    echo -e "${RED}  4. 恢复 seed 数据${NC}"
    echo ""

    if [ "$env" = "production" ]; then
        echo -e "${RED}${BOLD}当前环境：生产环境！${NC}"
        echo -e "${RED}${BOLD}强烈建议先备份数据库！${NC}"
    else
        echo -e "${YELLOW}当前环境：开发环境${NC}"
    fi

    echo ""
    read -p "$(echo -e ${YELLOW}确认继续吗？请输入 YES 继续: ${NC})" confirm

    if [ "$confirm" != "YES" ]; then
        print_info "已取消操作"
        exit 0
    fi
}

# 备份数据库（可选）
backup_database() {
    echo ""
    read -p "$(echo -e ${YELLOW}是否备份当前数据库？(y/n) ${NC})" backup

    if [[ $backup =~ ^[Yy]$ ]]; then
        print_step "备份数据库..."

        cd "$BACKEND_DIR"

        local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"

        # 尝试使用 pg_dump 备份
        if command -v pg_dump &> /dev/null; then
            # 从 .env 读取数据库连接信息
            if [ -f ".env" ]; then
                export $(cat .env | grep -v '^#' | xargs)
            fi

            print_info "正在备份到: $backup_file"
            pg_dump kindergarten > "$backup_file" 2>/dev/null || {
                print_warning "pg_dump 失败，跳过备份"
            }

            if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
                print_success "备份成功: $BACKEND_DIR/$backup_file"
            fi
        else
            print_warning "未找到 pg_dump，跳过备份"
        fi

        cd - > /dev/null
    else
        print_info "跳过备份"
    fi
}

# 删除旧迁移文件
delete_migrations() {
    print_step "删除旧迁移文件..."

    if [ -d "$MIGRATIONS_DIR" ]; then
        local count=$(find "$MIGRATIONS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)
        print_info "找到 $count 个迁移文件"

        rm -rf "$MIGRATIONS_DIR"
        print_success "已删除所有迁移文件"
    else
        print_info "没有找到迁移文件目录"
    fi
}

# 重置数据库
reset_database() {
    print_step "重置数据库..."

    cd "$BACKEND_DIR"

    print_info "运行 prisma migrate reset..."
    npx prisma migrate reset --force --skip-seed --schema=prisma/schema.prisma

    print_success "数据库已重置"

    cd - > /dev/null
}

# 创建新迁移
create_migration() {
    print_step "创建新迁移..."

    cd "$BACKEND_DIR"

    print_info "运行 prisma migrate dev..."
    npx prisma migrate dev --name init_with_user_approval --schema=prisma/schema.prisma

    print_success "迁移文件已创建"

    cd - > /dev/null
}

# 运行 seed
run_seed() {
    print_step "运行 seed 脚本..."

    cd "$BACKEND_DIR"

    print_info "恢复测试数据..."
    npm run seed

    print_success "Seed 数据已恢复"

    cd - > /dev/null
}

# 验证结果
verify_result() {
    print_step "验证结果..."

    cd "$BACKEND_DIR"

    print_info "检查数据库状态..."
    npx prisma migrate status --schema=prisma/schema.prisma

    print_success "数据库状态正常"

    cd - > /dev/null
}

# 显示完成信息
show_completion() {
    echo ""
    echo -e "${BOLD}${GREEN}=========================================${NC}"
    echo -e "${BOLD}${GREEN}  ✅ 数据库重置完成！${NC}"
    echo -e "${BOLD}${GREEN}=========================================${NC}"
    echo ""

    print_info "下一步操作："
    echo ""
    echo -e "${BLUE}1. 测试登录功能：${NC}"
    echo -e "   邮箱: admin@beichen.com"
    echo -e "   密码: admin123"
    echo ""
    echo -e "${BLUE}2. 测试注册功能：${NC}"
    echo -e "   访问: http://localhost:8892/register"
    echo ""
    echo -e "${BLUE}3. 提交代码（如果是开发环境）：${NC}"
    echo -e "   git add -A"
    echo -e "   git commit -m \"feat: 重置数据库 Schema，添加用户审核系统\""
    echo -e "   git push"
    echo ""
    echo -e "${BLUE}4. 在生产环境运行（推送后）：${NC}"
    echo -e "   cd /path/to/beichenoa"
    echo -e "   ./reset-database.sh"
    echo ""
}

# 主函数
main() {
    print_header

    # 检查目录
    check_directory

    # 检查环境
    ENV=$(check_environment)
    print_info "检测到环境: $ENV"

    # 显示警告和确认
    show_warning "$ENV"

    # 备份数据库（可选）
    backup_database

    # 执行重置流程
    delete_migrations
    reset_database
    create_migration
    run_seed
    verify_result

    # 显示完成信息
    show_completion
}

# 显示帮助信息
show_help() {
    cat << EOF
数据库完全重置脚本

用途：
    删除所有数据和迁移历史，从头开始创建干净的数据库

警告：
    ⚠️  此操作会删除所有数据！
    ⚠️  仅适用于开发早期或测试环境
    ⚠️  生产环境请谨慎使用！

用法：
    $0              运行完整的重置流程
    $0 --help       显示此帮助信息

执行流程：
    1. 检查环境和目录
    2. 显示警告并等待确认（输入 YES）
    3. 可选：备份数据库
    4. 删除所有迁移文件
    5. 重置数据库（删除所有数据）
    6. 创建新的迁移文件
    7. 运行 seed 脚本恢复测试数据
    8. 验证结果

使用场景：
    - 开发环境：Schema 频繁变更，向后兼容太复杂
    - 测试环境：需要从干净状态开始
    - 生产环境：数据量少，可以手动恢复

注意事项：
    - 必须在项目根目录（beichenoa/）运行
    - 需要有 Node.js 和 npm 环境
    - 需要有 PostgreSQL 数据库权限
    - 生产环境运行前建议先备份

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
