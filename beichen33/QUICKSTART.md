# Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (if not using Docker)
- Docker & Docker Compose (for containerized setup)

## Option 1: Docker Compose (Recommended)

```bash
cd beichen33
docker-compose up -d
```

Wait for services to start, then access:
- Frontend: http://localhost:8892
- Backend API: http://localhost:8891
- Swagger Docs: http://localhost:8891/api

## Option 2: Manual Setup

### 1. Start PostgreSQL

Ensure PostgreSQL is running on localhost:5432

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run start:dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

## Default Login

After seeding the database:
- Email: admin@kindergarten.com
- Password: admin123

## Test Accounts

- Admin: admin@kindergarten.com / admin123
- Teacher 1: teacher1@kindergarten.com / admin123
- Teacher 2: teacher2@kindergarten.com / admin123

## Stopping Services

### Docker:
```bash
docker-compose down
```

### Manual:
Press Ctrl+C in terminal windows

## Troubleshooting

### Port Conflicts

If ports 8891 or 8892 are in use:

Backend (.env):
```
PORT=8893
```

Frontend (vite.config.ts):
```typescript
server: { port: 8894 }
```

### Database Connection

Check DATABASE_URL in backend/.env:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kindergarten?schema=public"
```

### Prisma Issues

```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

## Features

1. Students: Manage student profiles and records
2. Classes: Organize classes and assign teachers
3. Growth Records: Track student development
4. Canteen: Manage ingredients, dishes, and menus
5. Nutrition: Analyze nutritional content
6. Forms: Dynamic form system
7. Reports: Statistics and analytics

## API Documentation

Visit http://localhost:8891/api for interactive API docs

## Database Schema

Key entities:
- Users (teachers, admin, parents)
- Students
- Classes
- Growth Records
- Ingredients
- Dishes
- Menus
- Forms

## Tech Stack Summary

Backend:
- NestJS + TypeScript
- PostgreSQL + Prisma
- JWT Auth
- Swagger

Frontend:
- React 18 + TypeScript
- Vite
- Ant Design
- Zustand
- TanStack Query
