/**
 * InternSage — VerificationModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-VERIFY-MOD-001
 * File   : src/verification/verification.module.ts
 */
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
