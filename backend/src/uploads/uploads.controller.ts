import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('uploads')
@Controller('api/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('screenshots')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a screenshot' })
  async uploadScreenshot(
    @CurrentUser() user: User,
    @Body() body: { taskId: string; screenshot: string; filename?: string },
  ) {
    const buffer = Buffer.from(body.screenshot, 'base64');
    const url = await this.uploadsService.uploadScreenshot(
      user.id,
      body.taskId,
      buffer,
      body.filename,
    );
    return { success: true, url };
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned URL for uploading' })
  async getUploadUrl(
    @CurrentUser() user: User,
    @Body() body: { key: string; contentType: string },
  ) {
    const safeKey = `uploads/${user.id}/${body.key}`;
    const uploadUrl = await this.uploadsService.getUploadUrl(
      safeKey,
      body.contentType,
    );
    return {
      uploadUrl,
      key: safeKey,
      publicUrl: this.uploadsService.getPublicUrl(safeKey),
    };
  }

  @Get('releases/latest')
  @Public()
  @ApiOperation({ summary: 'Get the latest agent release' })
  async getLatestRelease() {
    const release = await this.uploadsService.getLatestRelease();
    if (!release) {
      return { error: 'No releases found' };
    }
    return release;
  }

  @Get('screenshots/:taskId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get screenshots for a task' })
  async getScreenshots(
    @CurrentUser() user: User,
    @Param('taskId') taskId: string,
  ) {
    const files = await this.uploadsService.listFiles(
      `screenshots/${user.id}/${taskId}/`,
    );
    return files.map((file) => ({
      key: file,
      url: this.uploadsService.getPublicUrl(file),
    }));
  }
}

