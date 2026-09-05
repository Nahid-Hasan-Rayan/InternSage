// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — JobAggregatorModule
 *
 */
import { Module } from '@nestjs/common';
import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { RssJobAdapter } from './adapters/rss-job.adapter';
import { ArbeitnowJobAdapter } from './adapters/arbeitnow-job.adapter';
import { ScraperJobAdapter } from './adapters/scraper-job.adapter';
@Module({
  controllers: [AggregatorController],
  providers: [AggregatorService, RssJobAdapter, ArbeitnowJobAdapter, ScraperJobAdapter],
})
export class JobAggregatorModule {}
