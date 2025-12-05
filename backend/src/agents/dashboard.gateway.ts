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
import { Logger, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AgentsGateway } from './agents.gateway';

interface DashboardSocket extends Socket {
  userId?: string;
}

/**
 * WebSocket Gateway for Frontend Dashboard
 * Handles real-time updates to the web UI including:
 * - Task progress and logs
 * - Agent status updates
 * - Stop/cancel commands from UI to agents
 */
@WebSocketGateway({
  namespace: '/ws/dashboard',
  cors: {
    origin: '*',
  },
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('DashboardGateway');
  private connectedClients = new Map<string, Set<DashboardSocket>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => AgentsGateway))
    private agentsGateway: AgentsGateway,
  ) {}

  async handleConnection(client: DashboardSocket) {
    this.logger.log(`Dashboard client attempting connection: ${client.id}`);

    try {
      // Get token from query or auth
      const token =
        (client.handshake.query.token as string) ||
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      // Store user info on socket
      client.userId = payload.sub;

      // Track connected client
      if (!this.connectedClients.has(payload.sub)) {
        this.connectedClients.set(payload.sub, new Set());
      }
      this.connectedClients.get(payload.sub)!.add(client);

      // Join user's room
      client.join(`dashboard:${payload.sub}`);

      this.logger.log(`Dashboard client connected: ${client.id} for user ${payload.sub}`);

      // Confirm connection
      client.emit('connected', { message: 'Connected to dashboard' });
    } catch (error) {
      this.logger.warn(`Dashboard auth failed: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: DashboardSocket) {
    if (client.userId) {
      const userClients = this.connectedClients.get(client.userId);
      if (userClients) {
        userClients.delete(client);
        if (userClients.size === 0) {
          this.connectedClients.delete(client.userId);
        }
      }
      this.logger.log(`Dashboard client disconnected: ${client.id}`);
    }
  }

  /**
   * Handle request to stop a running task
   */
  @SubscribeMessage('task:stop')
  async handleStopTask(
    @ConnectedSocket() client: DashboardSocket,
    @MessageBody() data: { taskId: string; agentId?: string },
  ) {
    if (!client.userId) {
      return { success: false, message: 'Not authenticated' };
    }

    this.logger.log(`Stop task request from user ${client.userId}: ${data.taskId}`);

    // Get connected agents for this user
    const connectedAgents = this.agentsGateway.getConnectedAgents(client.userId);
    
    if (connectedAgents.length === 0) {
      this.logger.warn(`No connected agents for user ${client.userId}`);
      return { success: false, message: 'No agents connected' };
    }

    // Send stop command to all connected agents (or specific agent if provided)
    let sent = false;
    for (const agentId of connectedAgents) {
      if (!data.agentId || data.agentId === agentId) {
        const result = this.agentsGateway.sendStopCommand(agentId, data.taskId);
        if (result) {
          sent = true;
          this.logger.log(`Stop command sent to agent ${agentId}`);
        }
      }
    }

    return { success: sent, message: sent ? 'Stop command sent' : 'Failed to send stop command' };
  }

  /**
   * Handle request to cancel a task
   */
  @SubscribeMessage('task:cancel')
  async handleCancelTask(
    @ConnectedSocket() client: DashboardSocket,
    @MessageBody() data: { taskId: string; agentId?: string },
  ) {
    if (!client.userId) {
      return { success: false, message: 'Not authenticated' };
    }

    this.logger.log(`Cancel task request from user ${client.userId}: ${data.taskId}`);

    // Get connected agents for this user
    const connectedAgents = this.agentsGateway.getConnectedAgents(client.userId);
    
    if (connectedAgents.length === 0) {
      this.logger.warn(`No connected agents for user ${client.userId}`);
      return { success: false, message: 'No agents connected' };
    }

    // Send cancel command to all connected agents (or specific agent if provided)
    let sent = false;
    for (const agentId of connectedAgents) {
      if (!data.agentId || data.agentId === agentId) {
        const result = this.agentsGateway.sendCancelCommand(agentId, data.taskId);
        if (result) {
          sent = true;
          this.logger.log(`Cancel command sent to agent ${agentId}`);
        }
      }
    }

    return { success: sent, message: sent ? 'Cancel command sent' : 'Failed to send cancel command' };
  }

  // === Methods called by AgentsGateway to broadcast to dashboard ===

  /**
   * Send task log to user's dashboard
   */
  sendTaskLog(userId: string, log: {
    taskId: string;
    level: string;
    message: string;
    timestamp: Date;
    metadata?: any;
  }) {
    this.server.to(`dashboard:${userId}`).emit('task:log', log);
  }

  /**
   * Send task progress update
   */
  sendTaskProgress(userId: string, data: {
    taskId: string;
    agentId: string;
    progress: number;
    status: string;
    currentStep?: string;
  }) {
    this.server.to(`dashboard:${userId}`).emit('task:progress', data);
  }

  /**
   * Send task started notification
   */
  sendTaskStarted(userId: string, data: {
    taskId: string;
    agentId: string;
    type: string;
    url?: string;
    keywords?: string[];
  }) {
    this.server.to(`dashboard:${userId}`).emit('task:started', data);
  }

  /**
   * Send task completed notification
   */
  sendTaskCompleted(userId: string, data: {
    taskId: string;
    agentId: string;
    success: boolean;
    result?: any;
    error?: string;
  }) {
    this.server.to(`dashboard:${userId}`).emit('task:completed', data);
  }

  /**
   * Send agent status update
   */
  sendAgentStatus(userId: string, data: {
    agentId: string;
    status: string;
    currentTask?: string;
  }) {
    this.server.to(`dashboard:${userId}`).emit('agent:status', data);
  }

  /**
   * Check if user has connected dashboard clients
   */
  hasConnectedClients(userId: string): boolean {
    const clients = this.connectedClients.get(userId);
    return clients !== undefined && clients.size > 0;
  }
}

