#!/bin/bash

API_URL="http://localhost:8891/api"

echo "=== Testing Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@beichen.com","password":"123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

echo "Login successful. Token: ${TOKEN:0:20}..."

echo ""
echo "=== Testing Campus API ==="
curl -s -X GET "$API_URL/campus" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== Testing Positions API ==="
curl -s -X GET "$API_URL/positions" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== Testing Position Hierarchy ==="
curl -s -X GET "$API_URL/positions/hierarchy" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== Testing Users API ==="
curl -s -X GET "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== Testing Classes API ==="
curl -s -X GET "$API_URL/classes" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== Testing Students API ==="
curl -s -X GET "$API_URL/students" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== Testing Dishes API ==="
curl -s -X GET "$API_URL/canteen/dishes" \
  -H "Authorization: Bearer $TOKEN" | head -20

echo ""
echo "=== All tests completed ==="
