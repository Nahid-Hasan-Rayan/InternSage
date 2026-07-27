/**
 * InternSage — ProfileModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-PROFILE-MOD-001
 * File   : src/profile/profile.module.ts
 */

import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
