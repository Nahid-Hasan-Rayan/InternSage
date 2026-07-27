/**
 * InternSage — HealthModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-HEALTH-002
 * File   : src/health/health.module.ts
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
