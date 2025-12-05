import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async getDashboardStats(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['agents', 'tasks', 'signups'],
    });

    if (!user) {
      return null;
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter today's signups
    const todaySignups = user.signups?.filter((s) => {
      const signupDate = new Date(s.createdAt);
      return signupDate >= today && signupDate < tomorrow;
    }) || [];

    const todayTotal = todaySignups.length;
    const todaySuccessful = todaySignups.filter((s) => s.status === 'success').length;
    const successRate = todayTotal > 0 ? Math.round((todaySuccessful / todayTotal) * 100) : 0;

    // Get recent signups (last 10)
    const recentSignups = (user.signups || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Get recent tasks (last 10)
    const recentTasks = (user.tasks || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      today: {
        total: todayTotal,
        successful: todaySuccessful,
        successRate: successRate,
      },
      recentSignups: recentSignups,
      recentTasks: recentTasks,
      agents: user.agents || [],
    };
  }
}

