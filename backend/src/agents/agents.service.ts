import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Agent, AgentStatus } from './entities/agent.entity';
import { AgentLog, LogLevel } from './entities/agent-log.entity';
import { RegisterAgentDto } from './dto/register-agent.dto';
import {
  VersionResponseDto,
  AgentReleasesDto,
  DownloadInfoDto,
} from './dto/agent-version.dto';

// Agent version configuration
// In production, this would be stored in database or fetched from GitHub releases
const AGENT_VERSION_CONFIG = {
  latest_version: '2.0.0',
  min_supported_version: '1.0.0',
  release_date: '2025-01-01',
  release_notes: `
## What's New in v2.0.0

- 🚀 Improved browser automation with GPT-4o Vision
- 🔒 Enhanced stealth features for better detection bypass
- 📊 Real-time task progress reporting
- 🔄 Auto-update support
- 🐛 Various bug fixes and improvements
  `.trim(),
  downloads: {
    windows: {
      url: 'https://github.com/YOUR_ORG/inboxhunter-agent/releases/latest/download/InboxHunterAgent-Setup.exe',
      filename: 'InboxHunterAgent-Setup.exe',
      size: 85000000, // ~85MB
      checksum: '',
    },
    macos: {
      url: 'https://github.com/YOUR_ORG/inboxhunter-agent/releases/latest/download/InboxHunterAgent.dmg',
      filename: 'InboxHunterAgent.dmg',
      size: 90000000, // ~90MB
      checksum: '',
    },
    linux: {
      url: 'https://github.com/YOUR_ORG/inboxhunter-agent/releases/latest/download/InboxHunterAgent.AppImage',
      filename: 'InboxHunterAgent.AppImage',
      size: 100000000, // ~100MB
      checksum: '',
    },
  },
};

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
    @InjectRepository(AgentLog)
    private logsRepository: Repository<AgentLog>,
    private jwtService: JwtService,
  ) {}

  async generateRegistrationToken(userId: string) {
    // Generate a registration token that expires in 1 hour
    const token = this.jwtService.sign(
      {
        sub: userId,
        type: 'agent-registration',
      },
      { expiresIn: '1h' },
    );

    return { token };
  }

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

  // ============================================
  // Version & Update Methods
  // ============================================

  /**
   * Compare semantic versions
   * Returns: 1 if a > b, -1 if a < b, 0 if equal
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }
    return 0;
  }

  /**
   * Check if an update is available for the agent
   */
  async checkVersion(
    currentVersion: string,
    os?: string,
    arch?: string,
  ): Promise<VersionResponseDto> {
    const latestVersion = AGENT_VERSION_CONFIG.latest_version;
    const updateAvailable = this.compareVersions(latestVersion, currentVersion) > 0;

    // Determine download URL based on OS
    let downloadUrl: string | undefined;
    let checksum: string | undefined;

    if (updateAvailable && os) {
      const osKey = this.normalizeOS(os);
      const downloadInfo = AGENT_VERSION_CONFIG.downloads[osKey];
      if (downloadInfo) {
        downloadUrl = downloadInfo.url;
        checksum = downloadInfo.checksum || undefined;
      }
    }

    // Check if update is mandatory (current version below minimum)
    const mandatory =
      this.compareVersions(currentVersion, AGENT_VERSION_CONFIG.min_supported_version) < 0;

    return {
      update_available: updateAvailable,
      latest_version: latestVersion,
      current_version: currentVersion,
      download_url: downloadUrl,
      checksum,
      release_notes: updateAvailable ? AGENT_VERSION_CONFIG.release_notes : undefined,
      mandatory,
    };
  }

  /**
   * Get latest release information with all platform downloads
   */
  async getLatestRelease(): Promise<AgentReleasesDto> {
    const downloads: DownloadInfoDto[] = [];

    for (const [os, info] of Object.entries(AGENT_VERSION_CONFIG.downloads)) {
      downloads.push({
        os: os as 'windows' | 'macos' | 'linux',
        download_url: info.url,
        filename: info.filename,
        size: info.size,
        checksum: info.checksum || undefined,
      });
    }

    return {
      latest_version: AGENT_VERSION_CONFIG.latest_version,
      release_date: AGENT_VERSION_CONFIG.release_date,
      downloads,
      release_notes: AGENT_VERSION_CONFIG.release_notes,
    };
  }

  /**
   * Get download information for a specific platform
   */
  async getDownloadInfo(os: 'windows' | 'macos' | 'linux'): Promise<DownloadInfoDto> {
    const info = AGENT_VERSION_CONFIG.downloads[os];
    if (!info) {
      throw new NotFoundException(`No download available for ${os}`);
    }

    return {
      os,
      download_url: info.url,
      filename: info.filename,
      size: info.size,
      checksum: info.checksum || undefined,
    };
  }

  /**
   * Normalize OS string to our standard format
   */
  private normalizeOS(os: string): 'windows' | 'macos' | 'linux' {
    const osLower = os.toLowerCase();
    if (osLower.includes('win')) return 'windows';
    if (osLower.includes('darwin') || osLower.includes('mac')) return 'macos';
    return 'linux';
  }
}

