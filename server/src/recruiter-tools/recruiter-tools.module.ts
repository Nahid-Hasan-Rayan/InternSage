// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — RecruiterToolsModule
 *
 */

import { Module } from '@nestjs/common';
import { RecruiterToolsController } from './recruiter-tools.controller';
import { RecruiterToolsService } from './recruiter-tools.service';

@Module({
  controllers: [RecruiterToolsController],
  providers: [RecruiterToolsService],
})
export class RecruiterToolsModule {}
