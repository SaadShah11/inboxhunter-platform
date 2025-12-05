import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedLinksService } from './scraped-links.service';
import { ScrapedLinksController } from './scraped-links.controller';
import { ScrapedLink } from './entities/scraped-link.entity';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScrapedLink]),
    forwardRef(() => AgentsModule),
  ],
  controllers: [ScrapedLinksController],
  providers: [ScrapedLinksService],
  exports: [ScrapedLinksService],
})
export class ScrapedLinksModule {}

