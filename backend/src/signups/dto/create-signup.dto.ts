import { IsString, IsOptional, IsEnum, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SignupStatus } from '../entities/signup.entity';

export class CreateSignupDto {
  @ApiProperty({ example: 'https://example.com/signup' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: SignupStatus, required: false })
  @IsEnum(SignupStatus)
  @IsOptional()
  status?: SignupStatus;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  taskId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  screenshotUrl?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

