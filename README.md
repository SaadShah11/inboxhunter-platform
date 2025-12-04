# InboxHunter Platform

Web dashboard and API for the InboxHunter browser automation system.

**Tech Stack:** NestJS + TypeORM + PostgreSQL

## Architecture

```
inboxhunter-platform/
├── backend/                    # NestJS + TypeORM API
│   └── src/
│       ├── auth/               # Authentication (JWT)
│       ├── users/              # User management
│       ├── agents/             # Agent management + WebSocket
│       ├── tasks/              # Task management
│       ├── signups/            # Signup tracking
│       ├── credentials/        # Form credentials
│       ├── uploads/            # S3 file uploads
│       ├── common/             # Shared decorators, guards
│       ├── config/             # Configuration
│       ├── app.module.ts       # Root module
│       └── main.ts             # Entry point
├── frontend/                   # Next.js 14 Dashboard
├── docs/                       # Documentation
├── docker-compose.yml          # Docker services
└── env.example                 # Environment template
```

## Quick Start

### 1. Setup Environment

```bash
# From project root
cd inboxhunter-platform

# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

### 2. Start Database

```bash
# Start PostgreSQL with Docker
docker compose up -d postgres

# Verify it's running
docker ps
```

### 3. Start Backend

```bash
cd backend
npm install
npm run dev    # Starts at http://localhost:3001
```

> TypeORM will automatically sync the schema in development mode.

### 4. Start Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev    # Starts at http://localhost:3000
```

### 5. Access

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| API | http://localhost:3001 |
| API Health | http://localhost:3001/health |
| Swagger Docs | http://localhost:3001/api/docs |

---

## API Documentation

Full API documentation available at `/api/docs` (Swagger UI).

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Current user |
| `/api/users/dashboard` | GET | Dashboard stats |
| `/api/agents` | GET | List agents |
| `/api/agents/register` | POST | Register agent |
| `/api/tasks` | GET/POST | Manage tasks |
| `/api/signups` | GET | Signup history |
| `/api/credentials` | GET/POST | Manage credentials |
| `/api/uploads/screenshots` | POST | Upload screenshot |
| `/api/uploads/releases/latest` | GET | Latest agent version |

### WebSocket

Connect to `/ws/agent` with token:

```javascript
const socket = io('http://localhost:3001/ws/agent', {
  auth: { token: 'your-agent-token' }
});

socket.on('connected', (data) => console.log('Connected:', data));
socket.on('task:execute', (task) => console.log('New task:', task));
```

---

## Development

### Backend Commands

```bash
cd backend
npm run dev           # Start with hot reload
npm run build         # Build for production
npm run start:prod    # Run production build
npm run lint          # Run linter
npm run test          # Run tests

# TypeORM commands
npm run migration:generate -- -n MigrationName  # Generate migration
npm run migration:run                           # Run migrations
npm run schema:sync                             # Sync schema (dev only)
```

### Frontend Commands

```bash
cd frontend
npm run dev           # Start with hot reload
npm run build         # Build for production
npm run lint          # Run linter
```

---

## Environment Variables

All configuration in `env.example` → `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | inboxhunter |
| `POSTGRES_PASSWORD` | Database password | - |
| `POSTGRES_DB` | Database name | inboxhunter |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `JWT_SECRET` | Auth secret key | - |
| `CORS_ORIGIN` | Frontend URL | http://localhost:3000 |
| `AWS_ACCESS_KEY_ID` | S3 access key | - |
| `AWS_SECRET_ACCESS_KEY` | S3 secret | - |
| `S3_BUCKET` | S3 bucket name | inboxhunter-storage |

---

## Docker Commands

```bash
# Start database only (development)
docker compose up -d postgres

# View logs
docker compose logs -f postgres

# Stop all
docker compose down

# Database shell
docker exec -it inboxhunter-db psql -U inboxhunter -d inboxhunter

# Backup database
docker exec inboxhunter-db pg_dump -U inboxhunter inboxhunter > backup.sql
```

---

## Project Structure

### Backend Modules

| Module | Description |
|--------|-------------|
| `AuthModule` | JWT authentication, login/signup |
| `UsersModule` | User management, dashboard stats |
| `AgentsModule` | Agent CRUD, WebSocket Gateway |
| `TasksModule` | Task creation, status tracking |
| `SignupsModule` | Signup records, statistics |
| `CredentialsModule` | Form fill credentials |
| `UploadsModule` | S3 file uploads, screenshots |

### TypeORM Entities

| Entity | Description |
|--------|-------------|
| `User` | User accounts |
| `Agent` | Desktop agents |
| `AgentLog` | Agent activity logs |
| `Task` | Automation tasks |
| `Signup` | Signup attempts |
| `Credential` | Form credentials |

---

## Deployment

See `docs/AWS_DEPLOYMENT_GUIDE.md` for full AWS deployment instructions.

### Quick Deploy (EC2)

```bash
# On EC2 server
git clone https://github.com/YOUR_USERNAME/inboxhunter-platform.git
cd inboxhunter-platform

# Setup environment
cp env.example .env
nano .env  # Add production values

# Start database
docker compose up -d postgres

# Setup backend
cd backend
npm install
npm run build
npm run start:prod  # Or use PM2

# Frontend deploys to AWS Amplify
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS, TypeScript |
| ORM | TypeORM |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT (Passport) |
| WebSocket | Socket.io |
| API Docs | Swagger |
| Storage | AWS S3 |
| Frontend | Next.js 14, Tailwind CSS |

---

## Troubleshooting

### Database connection failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running
docker compose up -d postgres
```

### TypeORM sync issues

In development, TypeORM auto-syncs. For production:

```bash
npm run migration:generate -- -n InitialMigration
npm run migration:run
```

### CORS errors

Check `CORS_ORIGIN` in `.env` matches your frontend URL exactly.

---

## License

Proprietary - All Rights Reserved
