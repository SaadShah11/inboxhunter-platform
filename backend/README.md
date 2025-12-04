# InboxHunter Platform - Backend API

FastAPI-style backend built with Fastify + TypeScript for the InboxHunter platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT
- **Real-time**: WebSocket

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment:
```bash
cp env.example .env
# Edit .env with your database URL and secrets
```

3. Set up database:
```bash
npm run db:push    # Create tables
npm run db:generate # Generate Prisma client
```

4. Start development server:
```bash
npm run dev
```

Server runs at `http://localhost:3001`

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get profile with stats
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/dashboard` - Dashboard data

### Agents
- `POST /api/agents/register` - Register new agent
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/command` - Send command

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `POST /api/tasks/bulk` - Create bulk tasks
- `GET /api/tasks/:id` - Get task
- `POST /api/tasks/:id/cancel` - Cancel task

### Signups
- `GET /api/signups` - List signups
- `GET /api/signups/stats` - Get statistics
- `GET /api/signups/export` - Export CSV

### Credentials
- `GET /api/credentials` - List credentials
- `POST /api/credentials` - Create credential
- `PATCH /api/credentials/:id` - Update
- `DELETE /api/credentials/:id` - Delete

### WebSocket
- `WS /ws/agent?agent_id=&token=` - Agent connection

## Scripts

```bash
npm run dev       # Development with hot reload
npm run build     # Build for production
npm run start     # Run production build
npm run db:studio # Open Prisma Studio
npm run lint      # Run ESLint
npm run test      # Run tests
```

## Architecture

```
src/
├── index.ts          # Entry point
├── config.ts         # Configuration
├── lib/
│   ├── prisma.ts     # Database client
│   └── auth.ts       # Auth utilities
├── routes/
│   ├── auth.ts
│   ├── users.ts
│   ├── agents.ts
│   ├── tasks.ts
│   ├── signups.ts
│   └── credentials.ts
└── websocket/
    ├── manager.ts    # Connection manager
    └── handler.ts    # Message handler
```

