/**
 * InternSage — UniversityModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-UNI-MOD-001
 * File   : src/university/university.module.ts
 */
import { Module } from '@nestjs/common';
import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

@Module({
  controllers: [UniversityController],
  providers: [UniversityService],
})
export class UniversityModule {}
