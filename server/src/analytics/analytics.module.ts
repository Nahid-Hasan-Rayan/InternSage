// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — AnalyticsModule
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
