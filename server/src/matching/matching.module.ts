// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MatchingModule
 *
 */
import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { AnalyticsModule } from '../analytics/analytics.module';
@Module({
  imports: [AnalyticsModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
