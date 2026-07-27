/**
 * InternSage — CvModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-CV-MOD-001
 * File   : src/cv/cv.module.ts
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
