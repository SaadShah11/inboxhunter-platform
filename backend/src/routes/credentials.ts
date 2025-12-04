import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

const createCredentialSchema = z.object({
  name: z.string().optional(),
  firstName: z.string(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  isDefault: z.boolean().optional()
});

const updateCredentialSchema = createCredentialSchema.partial();

export async function credentialRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  
  // List credentials
  app.get('/', async (request) => {
    const user = (request as any).user;
    
    const credentials = await prisma.credential.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return credentials;
  });
  
  // Create credential
  app.post('/', async (request) => {
    const user = (request as any).user;
    const body = createCredentialSchema.parse(request.body);
    
    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.credential.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }
    
    // Build full phone number
    const phoneFull = body.phoneCountryCode && body.phoneNumber
      ? `${body.phoneCountryCode}${body.phoneNumber}`
      : null;
    
    // Build full name if not provided
    const fullName = body.fullName || [body.firstName, body.lastName].filter(Boolean).join(' ');
    
    const credential = await prisma.credential.create({
      data: {
        userId: user.id,
        name: body.name || 'Default',
        firstName: body.firstName,
        lastName: body.lastName,
        fullName,
        email: body.email,
        phoneCountryCode: body.phoneCountryCode || '+1',
        phoneNumber: body.phoneNumber,
        phoneFull,
        isDefault: body.isDefault || false
      }
    });
    
    return credential;
  });
  
  // Get single credential
  app.get('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const credential = await prisma.credential.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!credential) {
      return reply.status(404).send({ error: 'Credential not found' });
    }
    
    return credential;
  });
  
  // Update credential
  app.patch('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = updateCredentialSchema.parse(request.body);
    
    const credential = await prisma.credential.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!credential) {
      return reply.status(404).send({ error: 'Credential not found' });
    }
    
    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.credential.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }
    
    // Build full phone if parts provided
    const phoneFull = (body.phoneCountryCode || credential.phoneCountryCode) &&
      (body.phoneNumber || credential.phoneNumber)
      ? `${body.phoneCountryCode || credential.phoneCountryCode}${body.phoneNumber || credential.phoneNumber}`
      : credential.phoneFull;
    
    // Build full name if parts changed
    const fullName = body.fullName ||
      [body.firstName || credential.firstName, body.lastName || credential.lastName].filter(Boolean).join(' ');
    
    const updated = await prisma.credential.update({
      where: { id },
      data: {
        ...body,
        phoneFull,
        fullName
      }
    });
    
    return updated;
  });
  
  // Delete credential
  app.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const credential = await prisma.credential.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!credential) {
      return reply.status(404).send({ error: 'Credential not found' });
    }
    
    await prisma.credential.delete({ where: { id } });
    
    return { success: true };
  });
  
  // Set as default
  app.post('/:id/default', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    const credential = await prisma.credential.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!credential) {
      return reply.status(404).send({ error: 'Credential not found' });
    }
    
    // Unset other defaults
    await prisma.credential.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false }
    });
    
    // Set this as default
    await prisma.credential.update({
      where: { id },
      data: { isDefault: true }
    });
    
    return { success: true };
  });
}

