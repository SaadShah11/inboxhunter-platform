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
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RegisterAgentDto } from './dto/register-agent.dto';

@ApiTags('agents')
@Controller('api/agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new agent' })
  async register(
    @CurrentUser() user: User,
    @Body() registerDto: RegisterAgentDto,
  ) {
    return this.agentsService.register(user.id, registerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents for current user' })
  async findAll(@CurrentUser() user: User) {
    return this.agentsService.findByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findById(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get agent logs' })
  async getLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.agentsService.getLogs(id, limit);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agent' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.agentsService.delete(id, user.id);
  }
}

