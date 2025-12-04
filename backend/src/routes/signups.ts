import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

export async function signupRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  
  // List signups
  app.get('/', async (request) => {
    const user = (request as any).user;
    const {
      status,
      source,
      agentId,
      limit = '50',
      offset = '0',
      startDate,
      endDate
    } = request.query as {
      status?: string;
      source?: string;
      agentId?: string;
      limit?: string;
      offset?: string;
      startDate?: string;
      endDate?: string;
    };
    
    const where: any = { userId: user.id };
    if (status) where.status = status;
    if (source) where.source = source;
    if (agentId) where.agentId = agentId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    const [signups, total] = await Promise.all([
      prisma.signup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          agent: { select: { id: true, name: true } }
        }
      }),
      prisma.signup.count({ where })
    ]);
    
    return { signups, total };
  });
  
  // Get signup stats
  app.get('/stats', async (request) => {
    const user = (request as any).user;
    const { days = '30' } = request.query as { days?: string };
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get stats by status
    const byStatus = await prisma.signup.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        createdAt: { gte: startDate }
      },
      _count: true
    });
    
    // Get stats by day
    const byDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM "Signup"
      WHERE user_id = ${user.id}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at), status
      ORDER BY date DESC
    ` as { date: Date; status: string; count: bigint }[];
    
    // Get top platforms
    const byPlatform = await prisma.signup.groupBy({
      by: ['platform'],
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
        platform: { not: null }
      },
      _count: true,
      orderBy: { _count: { platform: 'desc' } },
      take: 10
    });
    
    // Calculate totals
    const total = byStatus.reduce((sum, s) => sum + s._count, 0);
    const successful = byStatus.find(s => s.status === 'SUCCESS')?._count || 0;
    
    return {
      summary: {
        total,
        successful,
        failed: byStatus.find(s => s.status === 'FAILED')?._count || 0,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0
      },
      byStatus,
      byDay: byDay.map(d => ({
        date: d.date,
        status: d.status,
        count: Number(d.count)
      })),
      byPlatform
    };
  });
  
  // Get single signup
  app.get('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const signup = await prisma.signup.findFirst({
      where: { id, userId: user.id },
      include: {
        agent: { select: { id: true, name: true } },
        task: true
      }
    });
    
    if (!signup) {
      return reply.status(404).send({ error: 'Signup not found' });
    }
    
    return signup;
  });
  
  // Delete signup
  app.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const signup = await prisma.signup.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!signup) {
      return reply.status(404).send({ error: 'Signup not found' });
    }
    
    await prisma.signup.delete({ where: { id } });
    
    return { success: true };
  });
  
  // Export signups as CSV
  app.get('/export', async (request, reply) => {
    const user = (request as any).user;
    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };
    
    const where: any = { userId: user.id };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    const signups = await prisma.signup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000 // Limit export
    });
    
    // Generate CSV
    const headers = ['ID', 'URL', 'Status', 'Platform', 'Email', 'Created At'];
    const rows = signups.map(s => [
      s.id,
      s.url,
      s.status,
      s.platform || '',
      s.emailUsed || '',
      s.createdAt.toISOString()
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');
    
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="signups.csv"');
    
    return csv;
  });
}

