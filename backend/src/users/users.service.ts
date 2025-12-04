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

    const totalAgents = user.agents?.length || 0;
    const onlineAgents =
      user.agents?.filter((a) => a.status === 'online').length || 0;
    const totalTasks = user.tasks?.length || 0;
    const completedTasks =
      user.tasks?.filter((t) => t.status === 'completed').length || 0;
    const totalSignups = user.signups?.length || 0;
    const successfulSignups =
      user.signups?.filter((s) => s.status === 'success').length || 0;

    return {
      agents: {
        total: totalAgents,
        online: onlineAgents,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
      },
      signups: {
        total: totalSignups,
        successful: successfulSignups,
        failed: totalSignups - successfulSignups,
      },
    };
  }
}

