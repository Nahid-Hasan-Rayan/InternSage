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
})
export class UniversityModule {}
