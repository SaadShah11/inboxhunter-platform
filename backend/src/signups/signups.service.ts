import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signup, SignupStatus } from './entities/signup.entity';
import { CreateSignupDto } from './dto/create-signup.dto';

@Injectable()
export class SignupsService {
  constructor(
    @InjectRepository(Signup)
    private signupsRepository: Repository<Signup>,
  ) {}

  async create(userId: string, dto: CreateSignupDto): Promise<Signup> {
    const signup = this.signupsRepository.create({
      userId,
      url: dto.url,
      domain: this.extractDomain(dto.url),
      email: dto.email,
      status: dto.status || SignupStatus.PENDING,
      taskId: dto.taskId,
      screenshotUrl: dto.screenshotUrl,
      metadata: dto.metadata,
    });

    return this.signupsRepository.save(signup);
  }

  async findByUser(userId: string, limit = 100): Promise<Signup[]> {
    return this.signupsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByTask(taskId: string): Promise<Signup[]> {
    return this.signupsRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    status: SignupStatus,
    error?: string,
  ): Promise<Signup | null> {
    const updateData: Partial<Signup> = { status };
    if (error) {
      updateData.error = error;
    }

    await this.signupsRepository.update(id, updateData);
    return this.signupsRepository.findOne({ where: { id } });
  }

  async getStats(userId: string) {
    const [signups, total] = await this.signupsRepository.findAndCount({
      where: { userId },
    });

    const successful = signups.filter(
      (s) => s.status === SignupStatus.SUCCESS,
    ).length;
    const failed = signups.filter(
      (s) => s.status === SignupStatus.FAILED,
    ).length;

    // Get unique domains
    const domains = [...new Set(signups.map((s) => s.domain).filter(Boolean))];

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      uniqueDomains: domains.length,
    };
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

