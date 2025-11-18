#!/bin/bash

BASE_URL="http://localhost:8891/api"
TOKEN=""

login() {
  echo "=== Login ==="
  RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@kindergarten.com","password":"admin123"}')
  TOKEN=$(echo $RESPONSE | jq -r '.access_token')
  echo "Token: ${TOKEN:0:20}..."
}

test_teachers() {
  echo -e "\n=== Teachers CRUD ==="

  echo "1. GET teachers"
  curl -s -X GET "$BASE_URL/users?role=TEACHER" \
    -H "Authorization: Bearer $TOKEN" | jq '.data | length'

  echo "2. POST teacher"
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"API Test Teacher","email":"api@test.com","role":"TEACHER","phone":"999"}')
  TEACHER_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
  echo "Created ID: $TEACHER_ID"

  echo "3. PUT teacher"
  curl -s -X PUT "$BASE_URL/users/$TEACHER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Teacher"}' | jq '.name'

  echo "4. DELETE teacher"
  curl -s -X DELETE "$BASE_URL/users/$TEACHER_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.id'
}

test_ingredients() {
  echo -e "\n=== Ingredients CRUD ==="

  echo "1. GET ingredients"
  curl -s -X GET "$BASE_URL/canteen/ingredients" \
    -H "Authorization: Bearer $TOKEN" | jq '.data | length'

  echo "2. POST ingredient"
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/canteen/ingredients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Ingredient","unit":"kg","protein":10,"fat":5,"carbs":20,"calories":200}')
  INGREDIENT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
  echo "Created ID: $INGREDIENT_ID"

  echo "3. GET ingredient"
  curl -s -X GET "$BASE_URL/canteen/ingredients/$INGREDIENT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.name'

  echo "4. PUT ingredient"
  curl -s -X PUT "$BASE_URL/canteen/ingredients/$INGREDIENT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Ingredient"}' | jq '.name'

  echo "5. DELETE ingredient"
  curl -s -X DELETE "$BASE_URL/canteen/ingredients/$INGREDIENT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.id'
}

test_dishes() {
  echo -e "\n=== Dishes CRUD ==="

  echo "1. GET dishes"
  curl -s -X GET "$BASE_URL/canteen/dishes" \
    -H "Authorization: Bearer $TOKEN" | jq '.data | length'

  echo "2. POST dish"
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/canteen/dishes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Dish","category":"Test","price":10}')
  DISH_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
  echo "Created ID: $DISH_ID"

  echo "3. GET dish"
  curl -s -X GET "$BASE_URL/canteen/dishes/$DISH_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.name'

  echo "4. PUT dish"
  curl -s -X PUT "$BASE_URL/canteen/dishes/$DISH_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Dish"}' | jq '.name'

  echo "5. DELETE dish"
  curl -s -X DELETE "$BASE_URL/canteen/dishes/$DISH_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.id'
}

test_forms() {
  echo -e "\n=== Forms CRUD ==="

  echo "1. GET templates"
  curl -s -X GET "$BASE_URL/forms/templates" \
    -H "Authorization: Bearer $TOKEN" | jq 'length'

  echo "2. POST template"
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/forms/templates" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test Form","description":"Test","fields":[{"id":"field1","type":"text","label":"Name","required":true}]}')
  TEMPLATE_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
  echo "Created ID: $TEMPLATE_ID"

  echo "3. POST submission"
  SUBMISSION_RESPONSE=$(curl -s -X POST "$BASE_URL/forms/submissions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"templateId\":\"$TEMPLATE_ID\",\"data\":{\"field1\":\"Test Value\"}}")
  SUBMISSION_ID=$(echo $SUBMISSION_RESPONSE | jq -r '.id')
  echo "Submission ID: $SUBMISSION_ID"

  echo "4. GET submissions"
  curl -s -X GET "$BASE_URL/forms/submissions" \
    -H "Authorization: Bearer $TOKEN" | jq '.data | length'
}

login
test_teachers
test_ingredients
test_dishes
test_forms

echo -e "\n=== All tests completed ==="
