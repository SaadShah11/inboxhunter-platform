import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ScrapedLink, LinkStatus } from './entities/scraped-link.entity';
import { CreateScrapedLinkDto, BulkCreateScrapedLinksDto, StartScrapeDto } from './dto/create-scraped-link.dto';
import { AgentsGateway } from '../agents/agents.gateway';

@Injectable()
export class ScrapedLinksService {
  constructor(
    @InjectRepository(ScrapedLink)
    private scrapedLinksRepository: Repository<ScrapedLink>,
    @Inject(forwardRef(() => AgentsGateway))
    private agentsGateway: AgentsGateway,
  ) {}

  async create(userId: string, dto: CreateScrapedLinkDto): Promise<ScrapedLink> {
    // Check for duplicate URL for this user
    const existing = await this.scrapedLinksRepository.findOne({
      where: { url: dto.url, userId },
    });

    if (existing) {
      // Update existing instead of creating duplicate
      existing.title = dto.title || existing.title;
      existing.advertiserName = dto.advertiserName || existing.advertiserName;
      existing.metadata = { ...existing.metadata, ...dto.metadata };
      return this.scrapedLinksRepository.save(existing);
    }

    // Extract domain from URL
    let domain = '';
    try {
      domain = new URL(dto.url).hostname;
    } catch {}

    const link = this.scrapedLinksRepository.create({
      ...dto,
      domain,
      userId,
    });

    return this.scrapedLinksRepository.save(link);
  }

  async bulkCreate(userId: string, dto: BulkCreateScrapedLinksDto): Promise<{ created: number; duplicates: number }> {
    let created = 0;
    let duplicates = 0;

    for (const linkDto of dto.links) {
      const existing = await this.scrapedLinksRepository.findOne({
        where: { url: linkDto.url, userId },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      let domain = '';
      try {
        domain = new URL(linkDto.url).hostname;
      } catch {}

      const link = this.scrapedLinksRepository.create({
        ...linkDto,
        domain,
        userId,
      });

      await this.scrapedLinksRepository.save(link);
      created++;
    }

    return { created, duplicates };
  }

  async findByUser(userId: string, status?: LinkStatus): Promise<ScrapedLink[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.scrapedLinksRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingByUser(userId: string): Promise<ScrapedLink[]> {
    return this.findByUser(userId, LinkStatus.PENDING);
  }

  async findById(id: string): Promise<ScrapedLink | null> {
    return this.scrapedLinksRepository.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: LinkStatus,
    error?: string,
  ): Promise<ScrapedLink | null> {
    const updateData: Partial<ScrapedLink> = { status };

    if (status === LinkStatus.SIGNED_UP) {
      updateData.signedUpAt = new Date();
    }

    if (error) {
      updateData.lastError = error;
    }

    await this.scrapedLinksRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    const link = await this.scrapedLinksRepository.findOne({
      where: { id, userId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.scrapedLinksRepository.remove(link);
  }

  async deleteAll(userId: string): Promise<{ deleted: number }> {
    const result = await this.scrapedLinksRepository.delete({ userId });
    return { deleted: result.affected || 0 };
  }

  async getStats(userId: string) {
    const links = await this.findByUser(userId);
    
    return {
      total: links.length,
      pending: links.filter(l => l.status === LinkStatus.PENDING).length,
      signedUp: links.filter(l => l.status === LinkStatus.SIGNED_UP).length,
      failed: links.filter(l => l.status === LinkStatus.FAILED).length,
      skipped: links.filter(l => l.status === LinkStatus.SKIPPED).length,
    };
  }

  // Start a scrape task
  async startScrape(userId: string, dto: StartScrapeDto, agentId?: string) {
    // Find an online agent
    const connectedAgents = this.agentsGateway.getConnectedAgents(userId);
    
    const targetAgentId = dto.agentId || agentId || connectedAgents[0];
    
    if (!targetAgentId) {
      return { success: false, error: 'No agents available' };
    }

    // Send scrape task to agent
    const sent = this.agentsGateway.sendTaskToAgent(targetAgentId, {
      type: 'scrape',
      source: 'meta_ads',
      params: {
        keywords: dto.keywords,
        limit: dto.limit || 50,
      },
    });

    if (sent) {
      return { 
        success: true, 
        message: 'Scrape task sent to agent',
        agentId: targetAgentId 
      };
    }

    return { success: false, error: 'Failed to send task to agent' };
  }

  // Start signup for specific links
  async startSignup(
    userId: string, 
    linkIds: string[], 
    agentId?: string,
    credentialId?: string,
  ) {
    const connectedAgents = this.agentsGateway.getConnectedAgents(userId);
    const targetAgentId = agentId || connectedAgents[0];

    if (!targetAgentId) {
      return { success: false, error: 'No agents available' };
    }

    // Get the links
    const links = await this.scrapedLinksRepository.find({
      where: { id: In(linkIds), userId },
    });

    if (links.length === 0) {
      return { success: false, error: 'No links found' };
    }

    // Send signup tasks for each link
    let sent = 0;
    for (const link of links) {
      const taskSent = this.agentsGateway.sendTaskToAgent(targetAgentId, {
        type: 'signup',
        task_id: link.id,
        url: link.url,
        credentialId,
      });

      if (taskSent) {
        sent++;
        // Mark as in-progress (we don't have this status, so keep pending)
      }
    }

    return {
      success: sent > 0,
      message: `Sent ${sent}/${links.length} signup tasks`,
      agentId: targetAgentId,
    };
  }

  // Start signup for all pending links
  async startSignupAll(userId: string, agentId?: string, credentialId?: string) {
    const pendingLinks = await this.findPendingByUser(userId);
    
    if (pendingLinks.length === 0) {
      return { success: false, error: 'No pending links to process' };
    }

    const linkIds = pendingLinks.map(l => l.id);
    return this.startSignup(userId, linkIds, agentId, credentialId);
  }

  // Add a custom link and optionally start signup
  async addCustomLink(
    userId: string,
    url: string,
    startSignupNow: boolean = false,
    agentId?: string,
    credentialId?: string,
  ) {
    const link = await this.create(userId, {
      url,
      source: 'manual',
    });

    if (startSignupNow) {
      const result = await this.startSignup(userId, [link.id], agentId, credentialId);
      return { link, signupResult: result };
    }

    return { link };
  }
}

