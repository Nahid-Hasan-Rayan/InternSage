/**
 * InternSage — JobsModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-JOBS-MOD-001
 * File   : src/jobs/jobs.module.ts
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
