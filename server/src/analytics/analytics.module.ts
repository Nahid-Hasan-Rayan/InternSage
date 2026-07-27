/**
 * InternSage — AnalyticsModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-ANALYTICS-MOD-001
 * File   : src/analytics/analytics.module.ts
 *
 * Exported so AuthService, ProfileService, etc. can inject
 * AnalyticsService to record deliberate product events (e.g.
 * AUTH_REGISTER) alongside the automatic REQUEST events written by
 * RequestLoggingInterceptor.
 */

import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
