/**
 * InternSage — JobAggregatorModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-MOD-001
 * File   : src/job-aggregator/job-aggregator.module.ts
 */
import { Module } from '@nestjs/common';
import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { RssJobAdapter } from './adapters/rss-job.adapter';
import { ScraperJobAdapter } from './adapters/scraper-job.adapter';
@Module({
  controllers: [AggregatorController],
  providers: [AggregatorService, RssJobAdapter, ScraperJobAdapter],
})
export class JobAggregatorModule {}
