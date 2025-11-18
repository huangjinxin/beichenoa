#!/bin/bash

echo "=== 创建日常记录测试数据 ==="

# 登录获取token
echo "1. 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8891/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@beichen.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功，Token: ${TOKEN:0:20}..."

# 获取园区列表
echo ""
echo "2. 获取园区列表..."
CAMPUSES=$(curl -s http://localhost:8891/api/campus \
  -H "Authorization: Bearer $TOKEN")
CAMPUS_ID=$(echo $CAMPUSES | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "✅ 找到园区ID: $CAMPUS_ID"

# 获取班级列表
echo ""
echo "3. 获取班级列表..."
CLASSES=$(curl -s http://localhost:8891/api/classes \
  -H "Authorization: Bearer $TOKEN")
CLASS_ID=$(echo $CLASSES | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "✅ 找到班级ID: $CLASS_ID"

# 创建每日观察记录
echo ""
echo "4. 创建每日观察记录..."
OBSERVATION_DATA='{
  "date": "'$(date +%Y-%m-%d)'",
  "weather": "☀️ 晴天",
  "classId": "'$CLASS_ID'",
  "campusId": "'$CAMPUS_ID'",
  "timeline": [
    {"time": "07:30", "event": "晨检"},
    {"time": "08:00", "event": "早餐"},
    {"time": "09:00", "event": "户外活动"},
    {"time": "10:00", "event": "学习活动"},
    {"time": "11:30", "event": "午餐"},
    {"time": "12:00", "event": "午睡"}
  ],
  "lifeActivity": "今天孩子们的生活活动非常规律。早餐时，大部分孩子都能够独立用餐，使用筷子的姿势也越来越标准。午睡时间，孩子们都能够自己穿脱衣服，并且整理好自己的床铺。",
  "outdoorActivity": "上午的户外活动时间，我们组织了跑步和跳绳游戏。孩子们非常积极，跑步时能够遵守规则，不推挤。跳绳活动中，小明和小红表现突出，已经能够连续跳20个以上。",
  "learningActivity": "今天的学习活动主题是认识数字1-10。通过游戏和实物操作，孩子们对数字有了更深的理解。大部分孩子都能够独立完成数字配对练习。",
  "gameActivity": "下午的区域游戏时间，孩子们自主选择了建构区和美工区。建构区的孩子们合作搭建了一座高塔，展现了良好的团队协作能力。",
  "wonderfulMoment": "小华今天主动帮助摔倒的小朋友，并且安慰她不要哭。这个温暖的场景让我们看到了孩子们的善良和同理心。",
  "homeCooperation": "今日温馨提示：天气转凉，请家长为孩子准备外套。明天我们将开展亲子手工活动，欢迎家长参与。"
}'

CREATE_OBS=$(curl -s -X POST http://localhost:8891/api/records/daily-observation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$OBSERVATION_DATA")

OBS_ID=$(echo $CREATE_OBS | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$OBS_ID" ]; then
  echo "❌ 创建每日观察记录失败！"
  echo "Response: $CREATE_OBS"
else
  echo "✅ 创建每日观察记录成功！ID: $OBS_ID"
fi

# 创建值班播报记录
echo ""
echo "5. 创建值班播报记录..."
DUTY_DATA='{
  "date": "'$(date +%Y-%m-%d)'",
  "weather": "☀️ 晴天",
  "campusId": "'$CAMPUS_ID'",
  "dutyLeader": "张园长",
  "attendance": "今日全园应到幼儿180人，实到176人，出勤率97.8%。病假3人，事假1人。教职工应到25人，实到25人，全勤。",
  "entryExit": "入园时段（7:30-8:30），家长能够按时送孩子入园，晨检工作井然有序。离园时段（16:30-17:30），各班教师严格执行接送卡制度，确保幼儿安全。",
  "learningActivity": "上午各班级按照教学计划开展集体教学活动。大班进行了数学活动《认识时钟》，中班开展了语言活动《小蝌蚪找妈妈》，小班进行了音乐活动《小星星》。",
  "areaActivity": "各班区域活动材料丰富，孩子们自主选择区域进行活动。建构区、美工区、阅读区等都深受孩子们喜爱。教师能够及时观察指导。",
  "outdoorActivity": "上午9:00-10:00，各班级按照户外活动安排有序进行。大班开展了足球游戏，中班进行了跳绳比赛，小班玩了滑梯和攀爬架。",
  "lifeActivity": "午餐时间，各班级就餐秩序良好。食堂提供的菜品有番茄炒蛋、红烧鸡腿、清炒青菜、紫菜蛋汤，幼儿进食情况良好。午睡时间，各班级能够按时组织幼儿午睡。",
  "notice": "1. 近期天气转凉，请家长为孩子准备适当的衣物。\\n2. 本周五将举行消防演练活动。\\n3. 下周一是家长开放日，欢迎家长来园观摩。",
  "safety": "今日进行了全园安全检查，重点检查了消防设施、用电安全、食品安全等。所有设施设备运行正常，未发现安全隐患。门卫严格执行来访登记制度。",
  "other": "今日保健医生对全园幼儿进行了晨检，未发现传染病症状。厨房卫生状况良好，食品留样规范。"
}'

CREATE_DUTY=$(curl -s -X POST http://localhost:8891/api/records/duty-report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DUTY_DATA")

DUTY_ID=$(echo $CREATE_DUTY | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$DUTY_ID" ]; then
  echo "❌ 创建值班播报记录失败！"
  echo "Response: $CREATE_DUTY"
else
  echo "✅ 创建值班播报记录成功！ID: $DUTY_ID"
fi

# 查询记录
echo ""
echo "6. 查询创建的记录..."
echo ""
echo "每日观察记录列表："
curl -s "http://localhost:8891/api/records/daily-observation" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -o '"id":"[^"]*","date":"[^"]*","weather":"[^"]*' | head -3

echo ""
echo ""
echo "值班播报记录列表："
curl -s "http://localhost:8891/api/records/duty-report" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -o '"id":"[^"]*","date":"[^"]*","weather":"[^"]*' | head -3

echo ""
echo ""
echo "=== 测试数据创建完成！==="
echo ""
echo "📝 访问地址："
echo "  - 每日观察列表: http://localhost:8892/records/daily-observation"
echo "  - 值班播报列表: http://localhost:8892/records/duty-report"
echo "  - 记录查询: http://localhost:8892/records/query"
echo ""
if [ ! -z "$OBS_ID" ]; then
  echo "  - 每日观察详情: http://localhost:8892/records/daily-observation/$OBS_ID"
fi
if [ ! -z "$DUTY_ID" ]; then
  echo "  - 值班播报详情: http://localhost:8892/records/duty-report/$DUTY_ID"
fi
