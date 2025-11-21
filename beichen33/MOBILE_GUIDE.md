# 幼儿园管理系统 - 移动端使用指南

## 📱 功能概览

本系统已成功添加移动端功能，支持教师和家长通过移动设备进行日常管理和信息查看。

### 核心特性
- ✅ 独立移动端路由（/teacher/* 教师端、/parent/* 家长端）
- ✅ 邮箱或身份证号登录
- ✅ 基于角色的自动路由跳转
- ✅ Ant Design Mobile UI（类APP交互体验）
- ✅ 底部Tab导航栏
- ✅ 教师端考勤管理（网格点名）
- ✅ 公告系统
- ✅ 班级学生管理

---

## 🎯 技术实现

### 技术栈
- **前端UI**: Ant Design Mobile 5.x
- **状态管理**: Zustand + TanStack Query
- **路由**: React Router v6
- **后端**: NestJS + Prisma + PostgreSQL

### 新增数据库模型
1. **AttendanceRecord** - 考勤记录批次
2. **Attendance** - 学生考勤明细
3. **Announcement** - 公告系统
4. **User.idCard** - 支持身份证号登录（已添加索引）

---

## 🔐 登录系统

### 登录方式
支持以下两种登录凭证（默认密码：`123456`）：
- 邮箱地址（如：`teacher@example.com`）
- 身份证号（如：`320102199001011234`）

### 角色路由
登录后系统会根据用户角色自动跳转：
- **ADMIN** → `/` (管理员桌面端)
- **TEACHER** → `/teacher/home` (教师移动端)
- **PARENT** → `/parent/home` (家长移动端)

---

## 👨‍🏫 教师端功能

### 路由结构
```
/teacher/home        # 首页
/teacher/attendance  # 考勤记录
/teacher/daily       # 日常记录（开发中）
/teacher/forms       # 表单填写（开发中）
/teacher/class       # 我的班级
```

### 1. 首页 (`/teacher/home`)
**功能：**
- 个人信息卡片（头像、姓名、职位、校区）
- 待办提醒（考勤未提交提示）
- 学校公告列表（按优先级和时间排序）

**特点：**
- 渐变色个人卡片设计
- 公告支持类型标签（紧急/通知）
- 自动获取教师相关公告

### 2. 考勤记录 (`/teacher/attendance`) ⭐核心功能
**操作流程：**
1. 选择日期和班级（如有多个班级）
2. 查看学生网格（4列展示）
3. 点击学生头像切换状态
4. 查看统计信息
5. 一键提交考勤

**状态说明：**
- 🟢 **到校** (PRESENT) - 默认状态，绿色
- 🟡 **请假** (LEAVE) - 黄色
- 🟠 **迟到** (LATE) - 橙色
- 🔴 **缺勤** (ABSENT) - 红色

**设计亮点：**
- 默认全部到校，仅需标记异常
- 点击学生头像循环切换状态
- 实时统计各状态人数
- 固定底部提交按钮
- 网格布局适配移动端

### 3. 我的班级 (`/teacher/class`)
**功能：**
- 显示班级名称
- 学生列表（头像 + 姓名 + 性别 + 年龄）
- 支持查看所带班级所有学生

---

## 📊 后端API接口

### 考勤相关 (`/api/attendance`)
```typescript
POST   /attendance/record                      # 创建考勤记录
GET    /attendance/class/:classId/date/:date   # 查询班级某日考勤
GET    /attendance/records                     # 考勤记录列表
GET    /attendance/student/:studentId/history  # 学生考勤历史
PATCH  /attendance/:id                         # 更新考勤状态
```

### 公告相关 (`/api/announcements`)
```typescript
GET    /announcements                # 查询公告列表
GET    /announcements/my             # 获取我的公告（教师/家长）
GET    /announcements/:id            # 获取公告详情
POST   /announcements                # 创建公告（管理员）
PATCH  /announcements/:id            # 更新公告
DELETE /announcements/:id            # 删除公告
```

### 登录接口 (`/api/auth`)
```typescript
POST /auth/login
Body: { identifier: string, password: string }
// identifier 支持邮箱或身份证号
```

---

## 🎨 移动端UI组件

### MobileLayout
底部Tab导航布局组件，支持：
- 教师端5个Tab（首页/考勤/记录/表单/班级）
- 家长端3个Tab（首页/记录/表单）
- 固定底部导航栏
- 自动高亮当前路由

### 样式特点
- 类APP交互体验
- 12px标准间距
- 卡片式内容布局
- 响应式网格系统
- 固定底部操作按钮

---

## 🚀 快速开始

### 1. 安装依赖
```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

### 2. 数据库迁移
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 3. 启动服务
```bash
# 后端
cd backend
npm run start:dev

# 前端
cd frontend
npm run dev
```

### 4. 访问系统
- 前端地址：http://localhost:8892
- 后端API：http://localhost:8891/api
- API文档：http://localhost:8891/api-docs

### 5. 测试登录
使用以下凭证测试：
- **管理员**: `admin@example.com` / `123456`
- **教师**: 使用数据库中的教师邮箱或身份证号 / `123456`

---

## 📝 开发建议

### 待完善功能
以下功能已规划但尚未实现（标记为"功能开发中"）：

1. **教师端日常记录** (`/teacher/daily`)
   - 批量记录模式
   - 快捷模板（吃饭/午睡/活动）
   - 左滑右滑切换学生
   - Swiper组件实现

2. **教师端表单填写** (`/teacher/forms`)
   - 查看管理员推送的表单
   - 在线填写提交
   - 表单历史记录

3. **家长端** (`/parent/*`)
   - 家长首页（孩子信息卡片）
   - 查看孩子记录（考勤+观察记录）
   - 表单中心（申请/通知类表单）

4. **离线缓存**
   - 利用TanStack Query缓存
   - LocalStorage存储待同步数据
   - 网络恢复自动上传

### 扩展方向
- 添加手势操作（左滑右滑）
- 实现语音输入
- 添加图片上传功能
- 推送通知集成
- PWA支持（安装到主屏幕）

---

## 🔧 故障排除

### 常见问题

**1. 登录后跳转到404**
- 检查用户角色是否正确
- 确认路由配置已生效
- 查看浏览器控制台错误

**2. 考勤提交失败**
- 检查后端服务是否运行
- 查看网络请求状态
- 确认用户有班级关联

**3. 公告不显示**
- 检查数据库中是否有公告数据
- 确认公告的 `publishedAt` 和 `expiredAt` 时间
- 查看 `isActive` 字段是否为 true

**4. 学生列表为空**
- 确认教师账号已关联班级
- 检查班级中是否有学生
- 查看API请求参数

---

## 📚 相关文件位置

### 后端
```
backend/src/modules/
├── auth/                      # 登录认证
├── attendance/                # 考勤模块 ⭐
│   ├── attendance.service.ts
│   ├── attendance.controller.ts
│   └── attendance.module.ts
└── announcements/             # 公告模块 ⭐
    ├── announcements.service.ts
    ├── announcements.controller.ts
    └── announcements.module.ts

backend/prisma/schema.prisma   # 数据库模型
```

### 前端
```
frontend/src/
├── pages/
│   ├── mobile/
│   │   └── teacher/           # 教师移动端 ⭐
│   │       ├── Home.tsx       # 首页
│   │       ├── Attendance.tsx # 考勤（核心）
│   │       ├── Daily.tsx      # 日常记录
│   │       ├── Forms.tsx      # 表单填写
│   │       └── Class.tsx      # 我的班级
│   └── Login.tsx              # 登录页（已修改）
├── components/
│   └── mobile/
│       ├── MobileLayout.tsx   # 移动端布局 ⭐
│       └── MobileLayout.css
└── services/
    └── api.ts                 # API封装（已更新）
```

---

## 📞 技术支持

如有问题或需要进一步开发，请参考：
- Ant Design Mobile 文档：https://mobile.ant.design/
- Prisma 文档：https://www.prisma.io/docs
- NestJS 文档：https://docs.nestjs.com/

---

**版本**: v1.0.0
**更新时间**: 2025-01-20
**开发者**: Claude Code
**状态**: ✅ 核心功能完成，可投入使用
