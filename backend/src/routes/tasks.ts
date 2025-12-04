import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authenticateAgent } from '../lib/auth.js';
import { agentManager } from '../websocket/manager.js';

const createTaskSchema = z.object({
  type: z.enum(['SIGNUP', 'SCRAPE', 'VERIFY']),
  url: z.string().url().optional(),
  source: z.string().optional(),
  agentId: z.string().optional(),
  credentialId: z.string().optional(),
  scrapeParams: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
  priority: z.number().optional()
});

const createBulkTasksSchema = z.object({
  type: z.enum(['SIGNUP', 'SCRAPE', 'VERIFY']),
  urls: z.array(z.string().url()),
  source: z.string().optional(),
  agentId: z.string().optional(),
  credentialId: z.string().optional()
});

export async function taskRoutes(app: FastifyInstance) {
  // === Agent routes ===
  
  // Get pending tasks for agent
  app.get('/pending', { preHandler: [authenticateAgent] }, async (request) => {
    const agent = (request as any).agent;
    const { limit = '10' } = request.query as { limit?: string };
    
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { agentId: agent.id, status: 'PENDING' },
          { agentId: null, userId: agent.userId, status: 'PENDING' }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: parseInt(limit),
      include: {
        credential: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            phoneCountryCode: true,
            phoneNumber: true,
            phoneFull: true
          }
        }
      }
    });
    
    return { tasks };
  });
  
  // Submit task result
  app.post('/:id/result', { preHandler: [authenticateAgent] }, async (request, reply) => {
    const agent = (request as any).agent;
    const { id } = request.params as { id: string };
    const body = request.body as { result: Record<string, any>; completedAt?: string };
    
    const task = await prisma.task.findFirst({
      where: { id, agentId: agent.id }
    });
    
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    
    // Determine status based on result
    const success = body.result.success === true;
    const status = success ? 'COMPLETED' : 'FAILED';
    
    // Update task
    await prisma.task.update({
      where: { id },
      data: {
        status,
        result: body.result,
        error: body.result.error,
        completedAt: new Date()
      }
    });
    
    // Create signup record if it was a signup task
    if (task.type === 'SIGNUP' && task.url) {
      await prisma.signup.create({
        data: {
          userId: agent.userId,
          taskId: task.id,
          agentId: agent.id,
          url: task.url,
          source: task.source,
          status: success ? 'SUCCESS' : 'FAILED',
          platform: body.result.platform,
          fieldsFilledRaw: body.result.fields_filled,
          errorType: body.result.error_type,
          errorMessage: body.result.error,
          processingTime: body.result.processing_time
        }
      });
    }
    
    return { success: true };
  });
  
  // === User routes ===
  
  // List tasks
  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const user = (request as any).user;
    const {
      status,
      type,
      agentId,
      limit = '50',
      offset = '0'
    } = request.query as {
      status?: string;
      type?: string;
      agentId?: string;
      limit?: string;
      offset?: string;
    };
    
    const where: any = { userId: user.id };
    if (status) where.status = status;
    if (type) where.type = type;
    if (agentId) where.agentId = agentId;
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          agent: { select: { id: true, name: true } },
          credential: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.task.count({ where })
    ]);
    
    return { tasks, total };
  });
  
  // Create single task
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const body = createTaskSchema.parse(request.body);
    
    // Verify agent belongs to user if specified
    if (body.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: body.agentId, userId: user.id }
      });
      if (!agent) {
        return reply.status(400).send({ error: 'Invalid agent' });
      }
    }
    
    // Verify credential belongs to user if specified
    if (body.credentialId) {
      const cred = await prisma.credential.findFirst({
        where: { id: body.credentialId, userId: user.id }
      });
      if (!cred) {
        return reply.status(400).send({ error: 'Invalid credential' });
      }
    }
    
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        type: body.type,
        url: body.url,
        source: body.source,
        agentId: body.agentId,
        credentialId: body.credentialId,
        scrapeParams: body.scrapeParams,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        priority: body.priority || 0
      }
    });
    
    // If agent is connected, notify them
    if (body.agentId) {
      agentManager.sendToAgent(body.agentId, {
        type: 'task',
        data: task
      });
    }
    
    return task;
  });
  
  // Create bulk tasks
  app.post('/bulk', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const body = createBulkTasksSchema.parse(request.body);
    
    // Verify agent and credential
    if (body.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: body.agentId, userId: user.id }
      });
      if (!agent) {
        return reply.status(400).send({ error: 'Invalid agent' });
      }
    }
    
    // Create tasks in batch
    const tasks = await prisma.task.createMany({
      data: body.urls.map(url => ({
        userId: user.id,
        type: body.type,
        url,
        source: body.source,
        agentId: body.agentId,
        credentialId: body.credentialId
      }))
    });
    
    return { created: tasks.count };
  });
  
  // Get single task
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
      include: {
        agent: { select: { id: true, name: true } },
        credential: true,
        signup: true
      }
    });
    
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    
    return task;
  });
  
  // Cancel task
  app.post('/:id/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const task = await prisma.task.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    
    if (task.status !== 'PENDING' && task.status !== 'QUEUED') {
      return reply.status(400).send({ error: 'Task cannot be cancelled' });
    }
    
    await prisma.task.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    
    return { success: true };
  });
  
  // Delete task
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const task = await prisma.task.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    
    await prisma.task.delete({ where: { id } });
    
    return { success: true };
  });
}

