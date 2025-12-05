import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScrapedLinkDto {
  @ApiProperty({ example: 'https://example.com/signup' })
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  advertiserName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  searchKeyword?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkCreateScrapedLinksDto {
  @ApiProperty({ type: [CreateScrapedLinkDto] })
  @IsArray()
  links: CreateScrapedLinkDto[];
}

export class StartScrapeDto {
  @ApiProperty({ example: ['marketing', 'funnel'] })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  agentId?: string;
}

