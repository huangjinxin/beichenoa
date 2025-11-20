#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本标题
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     Git 强制推送脚本 (Force Push Script)     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查是否在 git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ 错误：当前目录不是 Git 仓库！${NC}"
    exit 1
fi

# 显示当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}📍 当前分支：${NC}${GREEN}$CURRENT_BRANCH${NC}"
echo ""

# 步骤 1: 显示修改的文件
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 步骤 1/4: 检查修改的文件${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否有修改
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo -e "${YELLOW}⚠️  没有检测到任何修改！${NC}"
    echo -e "${YELLOW}   工作区是干净的，无需推送。${NC}"
    exit 0
fi

# 显示修改的文件列表
echo -e "${GREEN}📝 修改的文件：${NC}"
git status --short
echo ""

# 显示详细统计
MODIFIED_COUNT=$(git status --short | wc -l | xargs)
echo -e "${BLUE}📊 共有 ${MODIFIED_COUNT} 个文件被修改${NC}"
echo ""

# 步骤 2: 询问用户确认
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  步骤 2/4: 确认操作${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${RED}⚠️  警告：此操作将执行强制推送 (--force)！${NC}"
echo -e "${RED}   这将覆盖远程仓库的历史记录！${NC}"
echo -e "${RED}   请确保您了解此操作的风险！${NC}"
echo ""
echo -e "${YELLOW}📦 即将执行的操作：${NC}"
echo -e "   1. ${BLUE}git add .${NC}                    - 暂存所有修改"
echo -e "   2. ${BLUE}git commit -m \"...\"${NC}         - 提交修改"
echo -e "   3. ${BLUE}git push origin $CURRENT_BRANCH --force${NC} - 强制推送"
echo ""

# 等待用户确认
read -p "$(echo -e ${YELLOW}是否继续？[y/N]: ${NC})" -n 1 -r
echo ""
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 操作已取消${NC}"
    exit 1
fi

# 步骤 3: 执行 Git 操作
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🚀 步骤 3/4: 执行 Git 操作${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 3.1 Git Add
echo -e "${BLUE}[1/3]${NC} 正在暂存文件... ${BLUE}(git add .)${NC}"
if git add .; then
    echo -e "${GREEN}✅ 文件暂存成功${NC}"
else
    echo -e "${RED}❌ 文件暂存失败${NC}"
    exit 1
fi
echo ""

# 3.2 Git Commit
COMMIT_MESSAGE="update: 强制同步 $(date +%Y-%m-%d_%H:%M:%S)"
echo -e "${BLUE}[2/3]${NC} 正在提交修改... ${BLUE}(git commit)${NC}"
echo -e "${BLUE}      提交信息: ${NC}${COMMIT_MESSAGE}"

if git commit -m "$COMMIT_MESSAGE"; then
    echo -e "${GREEN}✅ 提交成功${NC}"
else
    # 检查是否是因为没有修改
    if [ $? -eq 1 ]; then
        echo -e "${YELLOW}⚠️  没有需要提交的修改（可能所有修改已被忽略）${NC}"
        exit 0
    else
        echo -e "${RED}❌ 提交失败${NC}"
        exit 1
    fi
fi
echo ""

# 3.3 Git Push Force
echo -e "${BLUE}[3/3]${NC} 正在强制推送到远程仓库... ${BLUE}(git push --force)${NC}"
echo -e "${RED}⚠️  正在执行强制推送，请稍候...${NC}"
echo ""

if git push origin "$CURRENT_BRANCH" --force; then
    echo ""
    echo -e "${GREEN}✅ 强制推送成功！${NC}"
else
    echo ""
    echo -e "${RED}❌ 推送失败${NC}"
    echo -e "${RED}   可能的原因：${NC}"
    echo -e "${RED}   - 网络连接问题${NC}"
    echo -e "${RED}   - 没有远程仓库权限${NC}"
    echo -e "${RED}   - 远程仓库地址配置错误${NC}"
    exit 1
fi
echo ""

# 步骤 4: 显示推送结果
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 步骤 4/4: 推送结果${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 显示最新的提交信息
echo -e "${GREEN}📝 最新提交：${NC}"
git log -1 --pretty=format:"   提交哈希: %h%n   提交者:   %an <%ae>%n   提交时间: %ad%n   提交信息: %s" --date=format:"%Y-%m-%d %H:%M:%S"
echo ""
echo ""

# 显示远程仓库状态
echo -e "${GREEN}🌐 远程仓库状态：${NC}"
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -n "$REMOTE_URL" ]; then
    echo -e "   远程地址: ${BLUE}$REMOTE_URL${NC}"
    echo -e "   推送分支: ${BLUE}$CURRENT_BRANCH${NC}"
else
    echo -e "${YELLOW}   无法获取远程仓库信息${NC}"
fi
echo ""

# 完成
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 所有操作已完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 提示信息
echo -e "${BLUE}💡 提示：${NC}"
echo -e "   - 远程仓库已被强制更新"
echo -e "   - 如果团队成员有本地副本，需要执行 ${YELLOW}git pull --rebase${NC} 或 ${YELLOW}git fetch && git reset --hard origin/$CURRENT_BRANCH${NC}"
echo ""
