import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, hashPassword } from '../lib/auth.js';

const updateUserSchema = z.object({
  name: z.string().optional(),
  settings: z.record(z.any()).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});

export async function userRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);
  
  // Get user profile
  app.get('/profile', async (request) => {
    const user = (request as any).user;
    
    // Get stats
    const [agentCount, signupCount, taskCount] = await Promise.all([
      prisma.agent.count({ where: { userId: user.id } }),
      prisma.signup.count({ where: { userId: user.id } }),
      prisma.task.count({ where: { userId: user.id } })
    ]);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        settings: user.settings,
        createdAt: user.createdAt
      },
      stats: {
        agents: agentCount,
        signups: signupCount,
        tasks: taskCount
      }
    };
  });
  
  // Update user profile
  app.patch('/profile', async (request, reply) => {
    const user = (request as any).user;
    const body = updateUserSchema.parse(request.body);
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        settings: body.settings ? body.settings : undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        settings: true
      }
    });
    
    return updated;
  });
  
  // Change password
  app.post('/change-password', async (request, reply) => {
    const user = (request as any).user;
    const body = changePasswordSchema.parse(request.body);
    
    // Get full user with password
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!fullUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    // Verify current password
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(body.currentPassword, fullUser.passwordHash);
    
    if (!valid) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const newHash = await hashPassword(body.newPassword);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });
    
    return { success: true };
  });
  
  // Get dashboard stats
  app.get('/dashboard', async (request) => {
    const user = (request as any).user;
    
    // Get recent activity
    const [
      recentSignups,
      recentTasks,
      agents,
      todayStats
    ] = await Promise.all([
      // Recent signups
      prisma.signup.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          url: true,
          status: true,
          platform: true,
          createdAt: true
        }
      }),
      
      // Recent tasks
      prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          url: true,
          createdAt: true
        }
      }),
      
      // Agent statuses
      prisma.agent.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          status: true,
          lastSeenAt: true
        }
      }),
      
      // Today's stats
      prisma.signup.groupBy({
        by: ['status'],
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _count: true
      })
    ]);
    
    // Calculate stats
    const todayTotal = todayStats.reduce((sum, s) => sum + s._count, 0);
    const todaySuccess = todayStats.find(s => s.status === 'SUCCESS')?._count || 0;
    
    return {
      recentSignups,
      recentTasks,
      agents,
      today: {
        total: todayTotal,
        successful: todaySuccess,
        successRate: todayTotal > 0 ? Math.round((todaySuccess / todayTotal) * 100) : 0
      }
    };
  });
}

