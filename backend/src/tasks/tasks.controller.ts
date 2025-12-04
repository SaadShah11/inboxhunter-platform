import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('tasks')
@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@CurrentUser() user: User, @Body() createDto: CreateTaskDto) {
    return this.tasksService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for current user' })
  async findAll(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.tasksService.findByUser(user.id, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a task' })
  async cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.tasksService.cancel(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.tasksService.delete(id, user.id);
    return { success: true };
  }
}

