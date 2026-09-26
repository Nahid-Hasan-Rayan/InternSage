// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — UniversityModule
 *
 */
import { Module } from '@nestjs/common';
import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

@Module({
  controllers: [UniversityController],
  providers: [UniversityService],
  // Exported so CopilotModule can ground a UNIVERSITY-role Sage
  // conversation in the exact same getDashboard/getAnalytics numbers
  // the university portal itself renders — one computation, not a
  // second copy that can drift from it.
  exports: [UniversityService],
})
export class UniversityModule {}
