import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SignupsService } from './signups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSignupDto } from './dto/create-signup.dto';

@ApiTags('signups')
@Controller('api/signups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SignupsController {
  constructor(private readonly signupsService: SignupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a signup record' })
  async create(@CurrentUser() user: User, @Body() createDto: CreateSignupDto) {
    return this.signupsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all signups for current user' })
  async findAll(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.signupsService.findByUser(user.id, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get signup statistics' })
  async getStats(@CurrentUser() user: User) {
    return this.signupsService.getStats(user.id);
  }
}

