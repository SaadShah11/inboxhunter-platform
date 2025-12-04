import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@ApiTags('credentials')
@Controller('api/credentials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credential set' })
  async create(
    @CurrentUser() user: User,
    @Body() createDto: CreateCredentialDto,
  ) {
    return this.credentialsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credentials for current user' })
  async findAll(@CurrentUser() user: User) {
    return this.credentialsService.findByUser(user.id);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default credential set' })
  async getDefault(@CurrentUser() user: User) {
    return this.credentialsService.getDefault(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credential by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.credentialsService.findById(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a credential set' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateCredentialDto,
  ) {
    return this.credentialsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a credential set' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.credentialsService.delete(id, user.id);
    return { success: true };
  }
}

