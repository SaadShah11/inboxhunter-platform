import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { uploadScreenshot, getUploadUrl, getLatestRelease, listFiles, getPublicUrl } from '../lib/s3';
import { prisma } from '../lib/prisma';

interface ScreenshotUploadBody {
  taskId: string;
  screenshot: string; // Base64 encoded
  filename?: string;
}

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload screenshot from agent
  fastify.post('/screenshots', {
    preValidation: [fastify.authenticate],
    handler: async (request: FastifyRequest<{ Body: ScreenshotUploadBody }>, reply: FastifyReply) => {
      try {
        const { taskId, screenshot, filename } = request.body;
        const userId = request.user.id;

        // Verify task belongs to user
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId,
          },
        });

        if (!task) {
          return reply.status(404).send({ error: 'Task not found' });
        }

        // Decode base64 screenshot
        const buffer = Buffer.from(screenshot, 'base64');

        // Upload to S3
        const url = await uploadScreenshot(userId, taskId, buffer, filename);

        return reply.send({
          success: true,
          url,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to upload screenshot' });
      }
    },
  });

  // Get pre-signed upload URL (for direct uploads from frontend)
  fastify.post('/upload-url', {
    preValidation: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{
        Body: { key: string; contentType: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { key, contentType } = request.body;
        const userId = request.user.id;

        // Ensure user can only upload to their own directory
        const safeKey = `uploads/${userId}/${key}`;

        const uploadUrl = await getUploadUrl(safeKey, contentType);

        return reply.send({
          uploadUrl,
          key: safeKey,
          publicUrl: getPublicUrl(safeKey),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate upload URL' });
      }
    },
  });

  // Get latest agent release
  fastify.get('/releases/latest', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const release = await getLatestRelease();

      if (!release) {
        return reply.status(404).send({ error: 'No releases found' });
      }

      return reply.send(release);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get latest release' });
    }
  });

  // List all releases
  fastify.get('/releases', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const files = await listFiles('downloads/');

      // Group by version
      const versions: Record<string, { windows?: string; macos?: string; linux?: string }> = {};

      files.forEach((file) => {
        const match = file.match(/downloads\/(v[\d.]+)\//);
        if (match) {
          const version = match[1];
          if (!versions[version]) {
            versions[version] = {};
          }

          if (file.includes('windows') || file.endsWith('.exe')) {
            versions[version].windows = getPublicUrl(file);
          } else if (file.includes('macos')) {
            versions[version].macos = getPublicUrl(file);
          } else if (file.includes('linux')) {
            versions[version].linux = getPublicUrl(file);
          }
        }
      });

      return reply.send({ releases: versions });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to list releases' });
    }
  });

  // Get user's screenshots for a task
  fastify.get('/screenshots/:taskId', {
    preValidation: [fastify.authenticate],
    handler: async (
      request: FastifyRequest<{ Params: { taskId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { taskId } = request.params;
        const userId = request.user.id;

        // Verify task belongs to user
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            userId,
          },
        });

        if (!task) {
          return reply.status(404).send({ error: 'Task not found' });
        }

        const files = await listFiles(`screenshots/${userId}/${taskId}/`);
        const screenshots = files.map((file) => ({
          key: file,
          url: getPublicUrl(file),
        }));

        return reply.send({ screenshots });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to list screenshots' });
      }
    },
  });
}

