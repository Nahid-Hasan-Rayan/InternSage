// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — HealthModule
 *
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
