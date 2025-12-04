import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authenticateAgent, generateToken } from '../lib/auth.js';
import { agentManager } from '../websocket/manager.js';

const registerAgentSchema = z.object({
  userToken: z.string(),
  machineId: z.string(),
  machineName: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  agentVersion: z.string().optional()
});

const updateAgentSchema = z.object({
  name: z.string().optional(),
  config: z.record(z.any()).optional()
});

export async function agentRoutes(app: FastifyInstance) {
  // Register new agent (called by agent during setup)
  app.post('/register', async (request, reply) => {
    const body = registerAgentSchema.parse(request.body);
    
    // Verify user token
    let userId: string;
    try {
      const payload = app.jwt.verify<{ userId: string }>(body.userToken);
      userId = payload.userId;
    } catch {
      return reply.status(401).send({ error: 'Invalid user token' });
    }
    
    // Check if machine already registered
    const existing = await prisma.agent.findUnique({
      where: { machineId: body.machineId }
    });
    
    if (existing) {
      // Return existing agent info
      return {
        agentId: existing.id,
        agentToken: existing.token,
        message: 'Agent already registered'
      };
    }
    
    // Generate agent token
    const agentToken = `agent_${generateToken(48)}`;
    
    // Create agent
    const agent = await prisma.agent.create({
      data: {
        userId,
        machineId: body.machineId,
        name: body.machineName || `Agent-${body.machineId.substring(0, 8)}`,
        token: agentToken,
        os: body.os,
        osVersion: body.osVersion,
        version: body.agentVersion
      }
    });
    
    return {
      agentId: agent.id,
      agentToken: agent.token
    };
  });
  
  // Verify agent token (called by agent on startup)
  app.get('/verify', { preHandler: [authenticateAgent] }, async (request) => {
    const agent = (request as any).agent;
    
    return {
      valid: true,
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status
      }
    };
  });
  
  // Get agent config (called by agent)
  app.get('/config', { preHandler: [authenticateAgent] }, async (request) => {
    const agent = (request as any).agent;
    
    // Get user's default credentials
    const defaultCredential = await prisma.credential.findFirst({
      where: { userId: agent.userId, isDefault: true }
    });
    
    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: agent.userId },
      select: { settings: true }
    });
    
    return {
      agentConfig: agent.config,
      credentials: defaultCredential ? {
        firstName: defaultCredential.firstName,
        lastName: defaultCredential.lastName,
        fullName: defaultCredential.fullName,
        email: defaultCredential.email,
        phone: {
          countryCode: defaultCredential.phoneCountryCode,
          number: defaultCredential.phoneNumber,
          full: defaultCredential.phoneFull
        }
      } : null,
      userSettings: user?.settings || {}
    };
  });
  
  // Update agent status (called by agent)
  app.post('/status', { preHandler: [authenticateAgent] }, async (request, reply) => {
    const agent = (request as any).agent;
    const body = request.body as { status: string; details?: Record<string, any> };
    
    const validStatuses = ['OFFLINE', 'ONLINE', 'RUNNING', 'PAUSED', 'ERROR'];
    if (!validStatuses.includes(body.status)) {
      return reply.status(400).send({ error: 'Invalid status' });
    }
    
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: body.status as any,
        lastSeenAt: new Date()
      }
    });
    
    return { success: true };
  });
  
  // === User routes (require user auth) ===
  
  // List user's agents
  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const user = (request as any).user;
    
    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        os: true,
        osVersion: true,
        version: true,
        lastSeenAt: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            signups: true
          }
        }
      }
    });
    
    return agents;
  });
  
  // Get single agent
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const agent = await prisma.agent.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: { tasks: true, signups: true }
        }
      }
    });
    
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    
    return agent;
  });
  
  // Update agent
  app.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = updateAgentSchema.parse(request.body);
    
    const agent = await prisma.agent.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    
    const updated = await prisma.agent.update({
      where: { id },
      data: {
        name: body.name,
        config: body.config
      }
    });
    
    // Push config to connected agent
    if (body.config) {
      agentManager.sendToAgent(id, {
        type: 'config',
        data: body.config
      });
    }
    
    return updated;
  });
  
  // Delete agent
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const agent = await prisma.agent.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    
    // Disconnect if connected
    agentManager.disconnectAgent(id);
    
    await prisma.agent.delete({ where: { id } });
    
    return { success: true };
  });
  
  // Send command to agent
  app.post('/:id/command', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as { command: string; params?: Record<string, any> };
    
    const agent = await prisma.agent.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    
    const sent = agentManager.sendToAgent(id, {
      type: 'command',
      data: {
        command: body.command,
        params: body.params || {}
      }
    });
    
    if (!sent) {
      return reply.status(400).send({ error: 'Agent is not connected' });
    }
    
    return { success: true };
  });
  
  // Get agent registration token (for adding new agent)
  app.post('/registration-token', { preHandler: [authenticate] }, async (request) => {
    const user = (request as any).user;
    
    // Generate a short-lived token for agent registration
    const token = app.jwt.sign(
      { userId: user.id },
      { expiresIn: '1h' }
    );
    
    return { token, expiresIn: '1 hour' };
  });
}

