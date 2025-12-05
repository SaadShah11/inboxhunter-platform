import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AgentsService } from './agents.service';
import { AgentsGateway } from './agents.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { CheckVersionDto, VersionResponseDto, AgentReleasesDto } from './dto/agent-version.dto';

@ApiTags('agents')
@Controller('api/agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly agentsGateway: AgentsGateway,
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS (No Auth Required)
  // For agent updates and downloads
  // ============================================

  @Get('version')
  @ApiOperation({ summary: 'Check for agent updates' })
  @ApiQuery({ name: 'current_version', required: true, example: '2.0.0' })
  @ApiQuery({ name: 'os', required: false, example: 'darwin' })
  @ApiQuery({ name: 'arch', required: false, example: 'arm64' })
  async checkVersion(
    @Query('current_version') currentVersion: string,
    @Query('os') os?: string,
    @Query('arch') arch?: string,
  ): Promise<VersionResponseDto> {
    return this.agentsService.checkVersion(currentVersion, os, arch);
  }

  @Get('releases')
  @ApiOperation({ summary: 'Get latest agent release information' })
  async getLatestRelease(): Promise<AgentReleasesDto> {
    return this.agentsService.getLatestRelease();
  }

  @Get('download/:os')
  @ApiOperation({ summary: 'Get download URL for specific platform' })
  async getDownloadUrl(
    @Param('os') os: 'windows' | 'macos' | 'linux',
  ) {
    return this.agentsService.getDownloadInfo(os);
  }

  // ============================================
  // PROTECTED ENDPOINTS (Auth Required)
  // ============================================

  @Post('registration-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a registration token for a new agent' })
  async generateRegistrationToken(@CurrentUser() user: User) {
    return this.agentsService.generateRegistrationToken(user.id);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new agent' })
  async register(
    @CurrentUser() user: User,
    @Body() registerDto: RegisterAgentDto,
  ) {
    return this.agentsService.register(user.id, registerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all agents for current user' })
  async findAll(@CurrentUser() user: User) {
    return this.agentsService.findByUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get agent by ID' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findById(id);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get agent logs' })
  async getLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.agentsService.getLogs(id, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an agent' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.agentsService.delete(id, user.id);
  }

  @Post(':id/command/stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop current task on agent' })
  async stopTask(
    @CurrentUser() user: User,
    @Param('id') agentId: string,
    @Body() body: { taskId: string },
  ) {
    const success = this.agentsGateway.sendStopCommand(agentId, body.taskId);
    return { success, message: success ? 'Stop command sent' : 'Agent not connected' };
  }

  @Post(':id/command/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel task on agent' })
  async cancelTask(
    @CurrentUser() user: User,
    @Param('id') agentId: string,
    @Body() body: { taskId: string },
  ) {
    const success = this.agentsGateway.sendCancelCommand(agentId, body.taskId);
    return { success, message: success ? 'Cancel command sent' : 'Agent not connected' };
  }

  @Get('connected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of connected agents' })
  async getConnectedAgents(@CurrentUser() user: User) {
    const agentIds = this.agentsGateway.getConnectedAgents(user.id);
    return { connectedAgents: agentIds };
  }
}

