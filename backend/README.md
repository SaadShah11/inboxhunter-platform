# InboxHunter API

NestJS + TypeORM backend for the InboxHunter platform.

## Tech Stack

- **Framework:** NestJS
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Auth:** JWT (Passport)
- **WebSocket:** Socket.io
- **Docs:** Swagger

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

## Scripts

```bash
npm run dev           # Development with hot reload
npm run build         # Build for production
npm run start:prod    # Run production build
npm run lint          # Lint code
npm run test          # Run tests

# TypeORM
npm run migration:generate -- -n Name  # Generate migration
npm run migration:run                  # Run migrations
npm run schema:sync                    # Sync schema (dev)
```

## Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # Users module
├── agents/         # Agents + WebSocket gateway
├── tasks/          # Tasks module
├── signups/        # Signups module
├── credentials/    # Credentials module
├── uploads/        # S3 uploads module
├── common/         # Shared decorators, guards
├── config/         # Configuration
├── app.module.ts   # Root module
└── main.ts         # Entry point
```

## API Documentation

Swagger UI available at `/api/docs` when server is running.
