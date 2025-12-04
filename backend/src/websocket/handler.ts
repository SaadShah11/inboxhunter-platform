import { FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { prisma } from '../lib/prisma.js';
import { agentManager } from './manager.js';

interface WSMessage {
  type: string;
  data?: any;
}

/**
 * WebSocket handler for agent connections
 */
export async function wsHandler(connection: SocketStream, request: FastifyRequest) {
  const { socket } = connection;
  
  // Get agent credentials from query
  const url = new URL(request.url, `http://${request.headers.host}`);
  const agentId = url.searchParams.get('agent_id');
  const token = url.searchParams.get('token');
  
  if (!agentId || !token) {
    socket.send(JSON.stringify({ type: 'error', data: { message: 'Missing credentials' } }));
    socket.close();
    return;
  }
  
  // Verify agent
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, token }
  });
  
  if (!agent) {
    socket.send(JSON.stringify({ type: 'error', data: { message: 'Invalid credentials' } }));
    socket.close();
    return;
  }
  
  // Register connection
  agentManager.addAgent(agent.id, agent.userId, socket);
  
  // Send welcome message
  socket.send(JSON.stringify({
    type: 'connected',
    data: {
      agentId: agent.id,
      name: agent.name,
      timestamp: new Date().toISOString()
    }
  }));
  
  // Handle incoming messages
  socket.on('message', async (rawMessage: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(rawMessage.toString());
      await handleMessage(agent.id, agent.userId, message, socket);
    } catch (err) {
      console.error('WebSocket message error:', err);
      socket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  });
  
  // Handle disconnection
  socket.on('close', () => {
    agentManager.removeAgent(agent.id);
  });
  
  // Handle errors
  socket.on('error', (err) => {
    console.error(`WebSocket error for agent ${agent.id}:`, err);
    agentManager.removeAgent(agent.id);
  });
}

/**
 * Handle incoming WebSocket message
 */
async function handleMessage(
  agentId: string,
  userId: string,
  message: WSMessage,
  socket: any
) {
  switch (message.type) {
    case 'heartbeat':
      // Respond to heartbeat
      socket.send(JSON.stringify({
        type: 'heartbeat_ack',
        data: { timestamp: new Date().toISOString() }
      }));
      
      // Update last seen
      await prisma.agent.update({
        where: { id: agentId },
        data: { lastSeenAt: new Date() }
      });
      break;
    
    case 'status':
      // Agent reporting its status
      const status = message.data?.status;
      if (status) {
        await prisma.agent.update({
          where: { id: agentId },
          data: { 
            status: status.toUpperCase(),
            lastSeenAt: new Date()
          }
        });
      }
      break;
    
    case 'result':
      // Task result
      const { task_id, result } = message.data || {};
      if (task_id && result) {
        const success = result.success === true;
        
        // Update task
        const task = await prisma.task.update({
          where: { id: task_id },
          data: {
            status: success ? 'COMPLETED' : 'FAILED',
            result,
            error: result.error,
            completedAt: new Date()
          }
        });
        
        // Create signup if applicable
        if (task.type === 'SIGNUP' && task.url) {
          await prisma.signup.create({
            data: {
              userId,
              taskId: task.id,
              agentId,
              url: task.url,
              source: task.source,
              status: success ? 'SUCCESS' : 'FAILED',
              platform: result.platform,
              fieldsFilledRaw: result.fields_filled,
              errorType: result.error_type,
              errorMessage: result.error,
              processingTime: result.processing_time
            }
          });
        }
        
        socket.send(JSON.stringify({
          type: 'result_ack',
          data: { task_id, received: true }
        }));
      }
      break;
    
    case 'log':
      // Agent log message
      const { level, message: logMessage, metadata } = message.data || {};
      if (level && logMessage) {
        await prisma.agentLog.create({
          data: {
            agentId,
            level,
            message: logMessage,
            metadata
          }
        });
      }
      break;
    
    case 'request_task':
      // Agent requesting a task
      const pendingTask = await prisma.task.findFirst({
        where: {
          OR: [
            { agentId, status: 'PENDING' },
            { agentId: null, userId, status: 'PENDING' }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
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
      
      if (pendingTask) {
        // Assign to this agent
        await prisma.task.update({
          where: { id: pendingTask.id },
          data: { 
            agentId,
            status: 'QUEUED',
            startedAt: new Date()
          }
        });
        
        socket.send(JSON.stringify({
          type: 'task',
          data: {
            task_id: pendingTask.id,
            type: pendingTask.type.toLowerCase(),
            url: pendingTask.url,
            source: pendingTask.source,
            credentials: pendingTask.credential ? {
              first_name: pendingTask.credential.firstName,
              last_name: pendingTask.credential.lastName,
              full_name: pendingTask.credential.fullName,
              email: pendingTask.credential.email,
              phone: {
                country_code: pendingTask.credential.phoneCountryCode,
                number: pendingTask.credential.phoneNumber,
                full: pendingTask.credential.phoneFull
              }
            } : undefined,
            scrape_params: pendingTask.scrapeParams
          }
        }));
      } else {
        socket.send(JSON.stringify({
          type: 'no_tasks',
          data: { message: 'No pending tasks' }
        }));
      }
      break;
    
    default:
      console.log(`Unknown message type from agent ${agentId}:`, message.type);
  }
}

