/**
 * InternSage — MetricsModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-METRICS-003
 * File   : src/metrics/metrics.module.ts
 *
 * Exported (not just declared) so RequestLoggingInterceptor and
 * AllExceptionsFilter — both registered globally in app.module.ts —
 * can inject MetricsService without importing this module a second
 * time.
 */

import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
