import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScrapedLinksService } from './scraped-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { 
  CreateScrapedLinkDto, 
  BulkCreateScrapedLinksDto, 
  StartScrapeDto 
} from './dto/create-scraped-link.dto';
import { LinkStatus } from './entities/scraped-link.entity';

@ApiTags('scraped-links')
@Controller('api/scraped-links')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScrapedLinksController {
  constructor(private readonly scrapedLinksService: ScrapedLinksService) {}

  @Post()
  @ApiOperation({ summary: 'Add a scraped link' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateScrapedLinkDto,
  ) {
    return this.scrapedLinksService.create(user.id, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk add scraped links' })
  async bulkCreate(
    @CurrentUser() user: User,
    @Body() dto: BulkCreateScrapedLinksDto,
  ) {
    return this.scrapedLinksService.bulkCreate(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all scraped links' })
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: LinkStatus,
  ) {
    return this.scrapedLinksService.findByUser(user.id, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get scraped links stats' })
  async getStats(@CurrentUser() user: User) {
    return this.scrapedLinksService.getStats(user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending links' })
  async getPending(@CurrentUser() user: User) {
    return this.scrapedLinksService.findPendingByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get link by ID' })
  async findOne(@Param('id') id: string) {
    return this.scrapedLinksService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a link' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    await this.scrapedLinksService.delete(id, user.id);
    return { success: true };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all links' })
  async deleteAll(@CurrentUser() user: User) {
    return this.scrapedLinksService.deleteAll(user.id);
  }

  // ========== Operations ==========

  @Post('scrape/start')
  @ApiOperation({ summary: 'Start scraping Meta Ads Library' })
  async startScrape(
    @CurrentUser() user: User,
    @Body() dto: StartScrapeDto,
  ) {
    return this.scrapedLinksService.startScrape(user.id, dto);
  }

  @Post('signup/single/:id')
  @ApiOperation({ summary: 'Start signup for a single link' })
  async startSignupSingle(
    @CurrentUser() user: User,
    @Param('id') linkId: string,
    @Body() body: { agentId?: string; credentialId?: string },
  ) {
    return this.scrapedLinksService.startSignup(
      user.id,
      [linkId],
      body.agentId,
      body.credentialId,
    );
  }

  @Post('signup/selected')
  @ApiOperation({ summary: 'Start signup for selected links' })
  async startSignupSelected(
    @CurrentUser() user: User,
    @Body() body: { linkIds: string[]; agentId?: string; credentialId?: string },
  ) {
    return this.scrapedLinksService.startSignup(
      user.id,
      body.linkIds,
      body.agentId,
      body.credentialId,
    );
  }

  @Post('signup/all')
  @ApiOperation({ summary: 'Start signup for all pending links' })
  async startSignupAll(
    @CurrentUser() user: User,
    @Body() body: { agentId?: string; credentialId?: string },
  ) {
    return this.scrapedLinksService.startSignupAll(
      user.id,
      body.agentId,
      body.credentialId,
    );
  }

  @Post('custom')
  @ApiOperation({ summary: 'Add custom link and optionally start signup' })
  async addCustomLink(
    @CurrentUser() user: User,
    @Body() body: { 
      url: string; 
      startSignup?: boolean;
      agentId?: string; 
      credentialId?: string;
    },
  ) {
    return this.scrapedLinksService.addCustomLink(
      user.id,
      body.url,
      body.startSignup || false,
      body.agentId,
      body.credentialId,
    );
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update link status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: LinkStatus; error?: string },
  ) {
    return this.scrapedLinksService.updateStatus(id, body.status, body.error);
  }
}

