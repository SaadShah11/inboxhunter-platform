import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Agent, AgentStatus } from './entities/agent.entity';
import { AgentLog, LogLevel } from './entities/agent-log.entity';
import { RegisterAgentDto } from './dto/register-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
    @InjectRepository(AgentLog)
    private logsRepository: Repository<AgentLog>,
    private jwtService: JwtService,
  ) {}

  async register(userId: string, dto: RegisterAgentDto) {
    // Check if agent already exists
    let agent = await this.agentsRepository.findOne({
      where: { machineId: dto.machineId, userId },
    });

    if (agent) {
      // Update existing agent
      agent.name = dto.name || agent.name;
      agent.version = dto.version ?? agent.version;
      agent.os = dto.os ?? agent.os;
      agent.status = AgentStatus.ONLINE;
      agent.lastSeenAt = new Date();
    } else {
      // Create new agent
      agent = this.agentsRepository.create({
        userId,
        machineId: dto.machineId,
        name: dto.name || `Agent-${dto.machineId.substring(0, 8)}`,
        version: dto.version,
        os: dto.os,
        status: AgentStatus.ONLINE,
        lastSeenAt: new Date(),
      });
    }

    await this.agentsRepository.save(agent);

    // Generate agent token
    const token = this.jwtService.sign({
      sub: agent.id,
      type: 'agent',
      userId,
    });

    return { agent, token };
  }

  async findByUser(userId: string): Promise<Agent[]> {
    return this.agentsRepository.find({
      where: { userId },
      order: { lastSeenAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Agent | null> {
    return this.agentsRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: AgentStatus, ipAddress?: string) {
    const updateData: Partial<Agent> = {
      status,
      lastSeenAt: new Date(),
    };

    if (ipAddress) {
      updateData.ipAddress = ipAddress;
    }

    await this.agentsRepository.update(id, updateData);
    return this.findById(id);
  }

  async setOffline(id: string) {
    return this.updateStatus(id, AgentStatus.OFFLINE);
  }

  async delete(id: string, userId: string) {
    const agent = await this.agentsRepository.findOne({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    await this.agentsRepository.remove(agent);
    return { success: true };
  }

  async addLog(
    agentId: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
    const log = this.logsRepository.create({
      agentId,
      level,
      message,
      metadata,
    });
    return this.logsRepository.save(log);
  }

  async getLogs(agentId: string, limit = 100) {
    return this.logsRepository.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async validateAgentToken(token: string): Promise<Agent | null> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'agent') {
        return null;
      }
      return this.findById(payload.sub);
    } catch {
      return null;
    }
  }
}

