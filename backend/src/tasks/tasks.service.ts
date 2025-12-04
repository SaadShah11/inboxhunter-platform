import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskType } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { AgentsGateway } from '../agents/agents.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private agentsGateway: AgentsGateway,
  ) {}

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      userId,
      type: dto.type || TaskType.SIGNUP,
      targetUrl: dto.targetUrl,
      config: dto.config,
      agentId: dto.agentId,
    });

    const savedTask = await this.tasksRepository.save(task);

    // If agent is specified and online, send task
    if (dto.agentId) {
      const sent = this.agentsGateway.sendTaskToAgent(dto.agentId, {
        id: savedTask.id,
        type: savedTask.type,
        targetUrl: savedTask.targetUrl,
        config: savedTask.config,
      });

      if (sent) {
        await this.updateStatus(savedTask.id, TaskStatus.RUNNING);
      }
    }

    return savedTask;
  }

  async findByUser(userId: string, limit = 50): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['agent'],
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasksRepository.findOne({
      where: { id },
      relations: ['agent', 'signups'],
    });
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    result?: Record<string, any>,
    error?: string,
  ): Promise<Task | null> {
    const updateData: Partial<Task> = { status };

    if (status === TaskStatus.RUNNING) {
      updateData.startedAt = new Date();
    }

    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    if (result) {
      updateData.result = result;
    }

    if (error) {
      updateData.error = error;
    }

    await this.tasksRepository.update(id, updateData);
    return this.findById(id);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.tasksRepository.update(id, { progress });
  }

  async cancel(id: string, userId: string): Promise<Task | null> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return task;
    }

    // Notify agent to cancel
    if (task.agentId) {
      this.agentsGateway.sendTaskToAgent(task.agentId, {
        action: 'cancel',
        taskId: id,
      });
    }

    return this.updateStatus(id, TaskStatus.CANCELLED);
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.tasksRepository.remove(task);
  }
}

