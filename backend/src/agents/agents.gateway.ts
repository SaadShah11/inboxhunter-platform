import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentStatus } from './entities/agent.entity';
import { LogLevel } from './entities/agent-log.entity';

interface AuthenticatedSocket extends Socket {
  agentId?: string;
  userId?: string;
}

@WebSocketGateway({
  namespace: '/ws/agent',
  cors: {
    origin: '*',
  },
})
export class AgentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('AgentsGateway');
  private connectedAgents = new Map<string, AuthenticatedSocket>();

  constructor(private agentsService: AgentsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client attempting connection: ${client.id}`);

    // Get token from query or auth header
    const token =
      client.handshake.query.token as string ||
      client.handshake.auth?.token;

    if (!token) {
      this.logger.warn(`No token provided, disconnecting: ${client.id}`);
      client.disconnect();
      return;
    }

    // Validate token
    const agent = await this.agentsService.validateAgentToken(token);
    if (!agent) {
      this.logger.warn(`Invalid token, disconnecting: ${client.id}`);
      client.disconnect();
      return;
    }

    // Store agent info on socket
    client.agentId = agent.id;
    client.userId = agent.userId;

    // Track connected agent
    this.connectedAgents.set(agent.id, client);

    // Update agent status
    const ipAddress =
      client.handshake.headers['x-forwarded-for']?.toString() ||
      client.handshake.address;
    await this.agentsService.updateStatus(agent.id, AgentStatus.ONLINE, ipAddress);

    // Join user room for targeted messages
    client.join(`user:${agent.userId}`);

    this.logger.log(`Agent connected: ${agent.id} (${agent.name})`);

    // Notify client of successful connection
    client.emit('connected', {
      agentId: agent.id,
      message: 'Connected successfully',
    });
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.agentId) {
      this.connectedAgents.delete(client.agentId);
      await this.agentsService.setOffline(client.agentId);
      this.logger.log(`Agent disconnected: ${client.agentId}`);
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status?: string },
  ) {
    if (!client.agentId) return;

    const status = data.status === 'busy' ? AgentStatus.BUSY : AgentStatus.ONLINE;
    await this.agentsService.updateStatus(client.agentId, status);

    return { event: 'heartbeat', data: { received: true } };
  }

  @SubscribeMessage('log')
  async handleLog(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { level: string; message: string; metadata?: any },
  ) {
    if (!client.agentId) return;

    const level = (data.level as LogLevel) || LogLevel.INFO;
    await this.agentsService.addLog(
      client.agentId,
      level,
      data.message,
      data.metadata,
    );

    return { event: 'log', data: { received: true } };
  }

  @SubscribeMessage('task:progress')
  async handleTaskProgress(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string; progress: number; status?: string },
  ) {
    if (!client.userId) return;

    // Emit to user's dashboard
    this.server.to(`user:${client.userId}`).emit('task:progress', {
      agentId: client.agentId,
      ...data,
    });

    return { event: 'task:progress', data: { received: true } };
  }

  @SubscribeMessage('task:complete')
  async handleTaskComplete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string; result?: any; error?: string },
  ) {
    if (!client.userId) return;

    // Emit to user's dashboard
    this.server.to(`user:${client.userId}`).emit('task:complete', {
      agentId: client.agentId,
      ...data,
    });

    return { event: 'task:complete', data: { received: true } };
  }

  // Send task to specific agent
  sendTaskToAgent(agentId: string, task: any) {
    const client = this.connectedAgents.get(agentId);
    if (client) {
      client.emit('task:execute', task);
      return true;
    }
    return false;
  }

  // Send message to all agents of a user
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Get connected agent IDs for a user
  getConnectedAgents(userId: string): string[] {
    const agentIds: string[] = [];
    this.connectedAgents.forEach((socket, agentId) => {
      if (socket.userId === userId) {
        agentIds.push(agentId);
      }
    });
    return agentIds;
  }
}

