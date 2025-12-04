import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAgentDto {
  @ApiProperty({ example: 'machine-uuid-12345' })
  @IsString()
  machineId: string;

  @ApiProperty({ example: 'My Desktop Agent', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '2.0.0', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ example: 'darwin', required: false })
  @IsString()
  @IsOptional()
  os?: string;
}

