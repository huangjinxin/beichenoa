# Beichen Kindergarten Management System

## Tech Stack

### Backend
- NestJS (TypeScript)
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Swagger API Documentation

### Frontend
- React 18
- TypeScript
- Vite
- Ant Design 5.x
- Zustand (State Management)
- TanStack Query (Data Fetching)

## Project Structure

```
beichen33/
├── backend/              # NestJS backend
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── modules/     # Feature modules
│   │   ├── common/      # Shared utilities
│   │   └── config/      # Configuration
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API services
│   │   └── store/       # State management
│   └── package.json
└── docker-compose.yml   # Docker configuration
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

Services:
- Backend API: http://localhost:8891
- Frontend: http://localhost:8892
- API Documentation: http://localhost:8891/api
- PostgreSQL: localhost:5432

### Manual Setup

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Database Migration

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

## Default Credentials

After seeding, use these credentials:
- Email: admin@kindergarten.com
- Password: admin123

## Features

1. Student Management
   - Student profiles
   - Growth records
   - Health tracking

2. Class Management
   - Class organization
   - Teacher assignment
   - Student allocation

3. Canteen Management
   - Ingredient database
   - Dish management
   - Menu planning
   - Nutrition analysis

4. Form System
   - Dynamic form templates
   - Form submissions
   - Approval workflows

5. Reports & Statistics
   - Student statistics
   - Growth trends
   - Nutrition reports

## API Documentation

Swagger documentation available at: http://localhost:8891/api

## Ports

- Backend: 8891
- Frontend: 8892
- PostgreSQL: 5432
