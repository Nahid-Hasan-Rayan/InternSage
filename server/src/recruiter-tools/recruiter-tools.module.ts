/**
 * InternSage — RecruiterToolsModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-RECTOOLS-MOD-001
 * File   : src/recruiter-tools/recruiter-tools.module.ts
 */

import { Module } from '@nestjs/common';
import { RecruiterToolsController } from './recruiter-tools.controller';
import { RecruiterToolsService } from './recruiter-tools.service';

@Module({
  controllers: [RecruiterToolsController],
  providers: [RecruiterToolsService],
})
export class RecruiterToolsModule {}
