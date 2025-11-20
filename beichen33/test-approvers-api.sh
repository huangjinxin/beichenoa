#!/bin/bash

# 审批人API测试脚本
# 使用方法: ./test-approvers-api.sh YOUR_TOKEN

set -e

TOKEN=${1:-""}
BASE_URL="http://localhost:3000/api"

if [ -z "$TOKEN" ]; then
  echo "❌ 错误: 请提供 JWT Token"
  echo "用法: ./test-approvers-api.sh YOUR_TOKEN"
  echo ""
  echo "获取 Token 的方法："
  echo "1. 登录系统"
  echo "2. 打开浏览器 DevTools (F12)"
  echo "3. 在 Console 中输入: localStorage.getItem('token')"
  echo "4. 复制输出的 token 值"
  exit 1
fi

echo "🔍 测试审批人相关 API..."
echo ""

# 测试 1: 获取审批人列表
echo "1️⃣  测试获取审批人列表 (GET /approvals/approvers)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/approvals/approvers")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 状态码: $HTTP_CODE"
  echo "📦 返回数据:"
  echo "$BODY" | jq '.[0:3]' 2>/dev/null || echo "$BODY"

  # 检查是否有 position 字段
  HAS_POSITION=$(echo "$BODY" | jq '.[0].position' 2>/dev/null)
  if [ "$HAS_POSITION" != "null" ] && [ -n "$HAS_POSITION" ]; then
    echo "✅ 用户包含职位信息"
  else
    echo "⚠️  警告: 用户没有职位信息，请为用户分配职位"
  fi
else
  echo "❌ 状态码: $HTTP_CODE"
  echo "错误信息: $BODY"
fi
echo ""

# 测试 2: 获取角色列表
echo "2️⃣  测试获取角色列表 (GET /approvals/roles)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/approvals/roles")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 状态码: $HTTP_CODE"
  echo "📦 返回数据:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ 状态码: $HTTP_CODE"
  echo "错误信息: $BODY"
fi
echo ""

# 测试 3: 获取职位列表
echo "3️⃣  测试获取职位列表 (GET /approvals/positions)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/approvals/positions")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 状态码: $HTTP_CODE"
  echo "📦 返回数据:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

  COUNT=$(echo "$BODY" | jq 'length' 2>/dev/null)
  if [ "$COUNT" = "0" ]; then
    echo "⚠️  警告: 系统中没有职位数据，请先创建职位"
  else
    echo "✅ 找到 $COUNT 个职位"
  fi
else
  echo "❌ 状态码: $HTTP_CODE"
  echo "错误信息: $BODY"
fi
echo ""

echo "✨ 测试完成！"
echo ""
echo "📝 问题排查建议："
echo "1. 如果 API 返回 401: Token 可能已过期，请重新登录"
echo "2. 如果 API 返回 404: 后端服务可能未启动或路由配置错误"
echo "3. 如果用户没有职位信息: 请在系统中为用户分配职位"
echo "4. 如果没有职位数据: 请先创建职位"
echo ""
echo "更多帮助请查看: APPROVAL_DEBUG_GUIDE.md"
