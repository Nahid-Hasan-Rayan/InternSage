/**
 * InternSage — MatchingModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MATCH-MOD-001
 * File   : src/matching/matching.module.ts
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
