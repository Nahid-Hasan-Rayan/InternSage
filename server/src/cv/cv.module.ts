// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CvModule
 *
 */

import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';

@Module({
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
