import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { agentRoutes } from './routes/agents.js';
import { taskRoutes } from './routes/tasks.js';
import { signupRoutes } from './routes/signups.js';
import { credentialRoutes } from './routes/credentials.js';
import { uploadRoutes } from './routes/uploads.js';
import { wsHandler } from './websocket/handler.js';
import { prisma } from './lib/prisma.js';

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'debug' : 'info',
    transport: config.nodeEnv === 'development' 
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined
  }
});

// Plugins
await app.register(cors, {
  origin: config.corsOrigin,
  credentials: true
});

await app.register(jwt, {
  secret: config.jwtSecret
});

await app.register(websocket);

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API Routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(userRoutes, { prefix: '/api/users' });
app.register(agentRoutes, { prefix: '/api/agents' });
app.register(taskRoutes, { prefix: '/api/tasks' });
app.register(signupRoutes, { prefix: '/api/signups' });
app.register(credentialRoutes, { prefix: '/api/credentials' });
app.register(uploadRoutes, { prefix: '/api/uploads' });

// WebSocket for agents
app.register(async (fastify) => {
  fastify.get('/ws/agent', { websocket: true }, wsHandler);
});

// Graceful shutdown
const shutdown = async () => {
  app.log.info('Shutting down...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`🚀 InboxHunter API running at http://${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };

