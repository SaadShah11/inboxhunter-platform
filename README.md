# InboxHunter Platform

Web dashboard and API for the InboxHunter browser automation system.

## Architecture

```
inboxhunter-platform/
├── backend/          # Fastify + TypeScript API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── websocket/ # Agent communication
│   │   └── lib/      # Utilities
│   └── prisma/       # Database schema
├── frontend/         # Next.js 14 Dashboard
│   └── src/
│       ├── app/      # Pages (App Router)
│       ├── lib/      # API client, store
│       └── components/
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- pnpm or npm

### Option 1: Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

- Dashboard: http://localhost:3000
- API: http://localhost:3001
- Database: localhost:5432

### Option 2: Manual Setup

**1. Start PostgreSQL:**
```bash
# Using Docker
docker run -d --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=inboxhunter \
  -p 5432:5432 \
  postgres:16-alpine

# Or install locally
```

**2. Setup Backend:**
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your settings

npm run db:push
npm run dev
```

**3. Setup Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

See `backend/README.md` for full API documentation.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/signup` | Create account |
| `POST /api/auth/login` | Login |
| `GET /api/users/dashboard` | Dashboard data |
| `GET /api/agents` | List agents |
| `POST /api/agents/register` | Register new agent |
| `GET /api/tasks` | List tasks |
| `POST /api/tasks` | Create task |
| `GET /api/signups` | List signups |
| `WS /ws/agent` | Agent WebSocket |

## Tech Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Fastify
- **Database**: PostgreSQL + Prisma
- **Auth**: JWT
- **WebSocket**: @fastify/websocket

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Components**: Custom + Radix UI

## Development

### Backend
```bash
cd backend
npm run dev       # Start with hot reload
npm run db:studio # Open Prisma Studio
npm run lint      # Run linter
```

### Frontend
```bash
cd frontend
npm run dev       # Start with hot reload
npm run build     # Production build
npm run lint      # Run linter
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment

### Docker
```bash
docker-compose -f docker-compose.yml up -d
```

### Manual
1. Build backend: `cd backend && npm run build`
2. Build frontend: `cd frontend && npm run build`
3. Start services with PM2 or systemd

## License

Proprietary - All Rights Reserved

