import { IsString, IsOptional, IsEnum, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ enum: TaskType, default: TaskType.SIGNUP })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({ example: 'https://example.com/signup' })
  @IsString()
  @IsOptional()
  targetUrl?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  agentId?: string;
}

