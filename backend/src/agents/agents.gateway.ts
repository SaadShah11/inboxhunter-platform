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
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentStatus } from './entities/agent.entity';
import { LogLevel } from './entities/agent-log.entity';
import { ScrapedLinksService } from '../scraped-links/scraped-links.service';
import { DashboardGateway } from './dashboard.gateway';

interface AuthenticatedSocket extends Socket {
  agentId?: string;
  userId?: string;
  currentTaskId?: string;
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

  constructor(
    private agentsService: AgentsService,
    @Inject(forwardRef(() => ScrapedLinksService))
    private scrapedLinksService: ScrapedLinksService,
    @Inject(forwardRef(() => DashboardGateway))
    private dashboardGateway: DashboardGateway,
  ) {}

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
    client.join(`agent:${agent.userId}`);

    this.logger.log(`Agent connected: ${agent.id} (${agent.name})`);

    // Notify dashboard of agent status change
    this.dashboardGateway.sendAgentStatus(agent.userId, {
      agentId: agent.id,
      status: 'online',
    });

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

      // Notify dashboard
      if (client.userId) {
        this.dashboardGateway.sendAgentStatus(client.userId, {
          agentId: client.agentId,
          status: 'offline',
        });
      }
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status?: string; taskId?: string },
  ) {
    if (!client.agentId) return;

    const status = data.status === 'busy' ? AgentStatus.BUSY : AgentStatus.ONLINE;
    await this.agentsService.updateStatus(client.agentId, status);

    // Update dashboard
    if (client.userId) {
      this.dashboardGateway.sendAgentStatus(client.userId, {
        agentId: client.agentId,
        status: data.status || 'online',
        currentTask: data.taskId,
      });
    }

    return { event: 'heartbeat', data: { received: true } };
  }

  @SubscribeMessage('log')
  async handleLog(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { level: string; message: string; taskId?: string; metadata?: any },
  ) {
    if (!client.agentId) return;

    const level = (data.level as LogLevel) || LogLevel.INFO;
    await this.agentsService.addLog(
      client.agentId,
      level,
      data.message,
      data.metadata,
    );

    // Forward log to dashboard in real-time
    if (client.userId) {
      this.dashboardGateway.sendTaskLog(client.userId, {
        taskId: data.taskId || client.currentTaskId || 'unknown',
        level: data.level,
        message: data.message,
        timestamp: new Date(),
        metadata: data.metadata,
      });
    }

    return { event: 'log', data: { received: true } };
  }

  @SubscribeMessage('task:started')
  async handleTaskStarted(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string; type: string; url?: string; keywords?: string[] },
  ) {
    if (!client.userId || !client.agentId) return;

    // Store current task on socket
    client.currentTaskId = data.taskId;

    // Notify dashboard
    this.dashboardGateway.sendTaskStarted(client.userId, {
      taskId: data.taskId,
      agentId: client.agentId,
      type: data.type,
      url: data.url,
      keywords: data.keywords,
    });

    // Update agent status to busy
    await this.agentsService.updateStatus(client.agentId, AgentStatus.BUSY);

    return { event: 'task:started', data: { received: true } };
  }

  @SubscribeMessage('task:progress')
  async handleTaskProgress(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string; progress: number; status?: string; currentStep?: string },
  ) {
    if (!client.userId || !client.agentId) return;

    // Forward to dashboard
    this.dashboardGateway.sendTaskProgress(client.userId, {
      taskId: data.taskId,
      agentId: client.agentId,
      progress: data.progress,
      status: data.status || 'running',
      currentStep: data.currentStep,
    });

    // Also emit on old channel for backward compatibility
    this.server.to(`user:${client.userId}`).emit('task:progress', {
      agentId: client.agentId,
      ...data,
    });

    return { event: 'task:progress', data: { received: true } };
  }

  @SubscribeMessage('task:complete')
  async handleTaskComplete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string; success?: boolean; result?: any; error?: string },
  ) {
    if (!client.userId || !client.agentId) return;

    // Clear current task
    client.currentTaskId = undefined;

    // Forward to dashboard
    this.dashboardGateway.sendTaskCompleted(client.userId, {
      taskId: data.taskId,
      agentId: client.agentId,
      success: data.success !== false && !data.error,
      result: data.result,
      error: data.error,
    });

    // Update agent status back to online
    await this.agentsService.updateStatus(client.agentId, AgentStatus.ONLINE);

    // Also emit on old channel for backward compatibility
    this.server.to(`user:${client.userId}`).emit('task:complete', {
      agentId: client.agentId,
      ...data,
    });

    return { event: 'task:complete', data: { received: true } };
  }

  @SubscribeMessage('scrape:results')
  async handleScrapeResults(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { links: any[]; count: number; taskId?: string },
  ) {
    if (!client.userId) return;

    this.logger.log(`Received ${data.count} scraped links from agent ${client.agentId}`);

    try {
      // Bulk create scraped links
      const result = await this.scrapedLinksService.bulkCreate(client.userId, {
        links: data.links,
      });

      this.logger.log(`Saved ${result.created} new links, ${result.duplicates} duplicates`);

      // Send log to dashboard
      this.dashboardGateway.sendTaskLog(client.userId, {
        taskId: data.taskId || 'scrape',
        level: 'success',
        message: `Saved ${result.created} new links (${result.duplicates} duplicates skipped)`,
        timestamp: new Date(),
      });

      // Notify user's dashboard
      this.server.to(`user:${client.userId}`).emit('scrape:complete', {
        agentId: client.agentId,
        created: result.created,
        duplicates: result.duplicates,
        total: data.count,
      });

      return { event: 'scrape:results', data: { received: true, ...result } };
    } catch (error) {
      this.logger.error(`Failed to save scraped links: ${error}`);

      // Send error log to dashboard
      this.dashboardGateway.sendTaskLog(client.userId, {
        taskId: data.taskId || 'scrape',
        level: 'error',
        message: `Failed to save links: ${error.message}`,
        timestamp: new Date(),
      });

      return { event: 'scrape:results', data: { received: false, error: error.message } };
    }
  }

  // Send task to specific agent
  sendTaskToAgent(agentId: string, task: any): boolean {
    const client = this.connectedAgents.get(agentId);
    if (client) {
      client.emit('task:execute', task);
      return true;
    }
    return false;
  }

  // Send stop command to agent
  sendStopCommand(agentId: string, taskId: string): boolean {
    const client = this.connectedAgents.get(agentId);
    if (client) {
      client.emit('command', {
        type: 'stop_task',
        taskId,
      });
      return true;
    }
    return false;
  }

  // Send cancel command to agent
  sendCancelCommand(agentId: string, taskId: string): boolean {
    const client = this.connectedAgents.get(agentId);
    if (client) {
      client.emit('command', {
        type: 'cancel_task',
        taskId,
      });
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

  // Get first available agent for a user
  getFirstAvailableAgent(userId: string): string | null {
    for (const [agentId, socket] of this.connectedAgents) {
      if (socket.userId === userId && !socket.currentTaskId) {
        return agentId;
      }
    }
    // If no idle agent, return any connected agent
    for (const [agentId, socket] of this.connectedAgents) {
      if (socket.userId === userId) {
        return agentId;
      }
    }
    return null;
  }
}
