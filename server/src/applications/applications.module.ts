// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — ApplicationsModule
 *
 * Does NOT import/call EventEmitterModule.forRoot() itself —
 * that's called exactly once in AppModule, which makes EventEmitter2
 * available globally. This module just needs to register
 * ApplicationStatusListener as a provider so Nest instantiates it
 * (its @OnEvent decorator does the rest).
 */

import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationStatusListener } from './listeners/application-status.listener';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationStatusListener],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
