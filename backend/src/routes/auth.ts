import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, authenticate, JWTPayload } from '../lib/auth.js';

// Schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export async function authRoutes(app: FastifyInstance) {
  // Sign up
  app.post('/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body);
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email }
    });
    
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' });
    }
    
    // Create user
    const passwordHash = await hashPassword(body.password);
    
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true
      }
    });
    
    // Generate token
    const token = app.jwt.sign({
      userId: user.id,
      email: user.email
    } satisfies JWTPayload);
    
    return {
      user,
      token
    };
  });
  
  // Login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    
    const user = await prisma.user.findUnique({
      where: { email: body.email }
    });
    
    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }
    
    const valid = await verifyPassword(body.password, user.passwordHash);
    
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Generate token
    const token = app.jwt.sign({
      userId: user.id,
      email: user.email
    } satisfies JWTPayload);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      token
    };
  });
  
  // Get current user
  app.get('/me', { preHandler: [authenticate] }, async (request) => {
    const user = (request as any).user;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      settings: user.settings,
      createdAt: user.createdAt
    };
  });
  
  // Logout (client-side token removal, but we can track it)
  app.post('/logout', { preHandler: [authenticate] }, async () => {
    return { success: true };
  });
}

