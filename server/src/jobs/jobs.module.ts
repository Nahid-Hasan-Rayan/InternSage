// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — JobsModule
 *
 */
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AnalyticsModule } from '../analytics/analytics.module';
@Module({
  imports: [AnalyticsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
