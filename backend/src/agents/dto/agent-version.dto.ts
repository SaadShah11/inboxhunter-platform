import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckVersionDto {
  @ApiProperty({ description: 'Current agent version', example: '2.0.0' })
  @IsString()
  current_version: string;

  @ApiPropertyOptional({ description: 'Operating system', example: 'darwin' })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiPropertyOptional({ description: 'CPU architecture', example: 'arm64' })
  @IsOptional()
  @IsString()
  arch?: string;
}

export class VersionResponseDto {
  @ApiProperty({ description: 'Whether an update is available' })
  update_available: boolean;

  @ApiProperty({ description: 'Latest version available', example: '2.1.0' })
  latest_version: string;

  @ApiPropertyOptional({ description: 'Current version of the agent' })
  current_version?: string;

  @ApiPropertyOptional({ description: 'Download URL for the update' })
  download_url?: string;

  @ApiPropertyOptional({ description: 'SHA256 checksum of the download' })
  checksum?: string;

  @ApiPropertyOptional({ description: 'Release notes for the update' })
  release_notes?: string;

  @ApiPropertyOptional({ description: 'Whether this update is mandatory' })
  mandatory?: boolean;
}

export class DownloadInfoDto {
  @ApiProperty({ description: 'Operating system' })
  os: 'windows' | 'macos' | 'linux';

  @ApiProperty({ description: 'Download URL' })
  download_url: string;

  @ApiProperty({ description: 'File name' })
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiPropertyOptional({ description: 'SHA256 checksum' })
  checksum?: string;
}

export class AgentReleasesDto {
  @ApiProperty({ description: 'Latest version' })
  latest_version: string;

  @ApiProperty({ description: 'Release date' })
  release_date: string;

  @ApiProperty({ description: 'Downloads for each platform', type: [DownloadInfoDto] })
  downloads: DownloadInfoDto[];

  @ApiPropertyOptional({ description: 'Release notes' })
  release_notes?: string;
}

