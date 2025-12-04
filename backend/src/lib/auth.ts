import bcrypt from 'bcryptjs';
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './prisma.js';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// JWT payload type
export interface JWTPayload {
  userId: string;
  email: string;
}

// Agent token payload
export interface AgentTokenPayload {
  agentId: string;
  userId: string;
}

// Auth middleware for protected routes
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const payload = await request.jwtVerify<JWTPayload>();
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }
    
    // Attach user to request
    (request as any).user = user;
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

// Agent auth middleware
export async function authenticateAgent(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing agent token' });
  }
  
  const token = authHeader.substring(7);
  
  const agent = await prisma.agent.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!agent) {
    return reply.status(401).send({ error: 'Invalid agent token' });
  }
  
  // Update last seen
  await prisma.agent.update({
    where: { id: agent.id },
    data: { lastSeenAt: new Date() }
  });
  
  (request as any).agent = agent;
}

