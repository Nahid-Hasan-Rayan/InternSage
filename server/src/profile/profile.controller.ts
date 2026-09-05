// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — ProfileController
 *
 * No route here accepts a profile id from the caller — the
 * identity comes only from `@CurrentUser()`, which is populated
 * by JwtStrategy from a verified token. See ProfileService for
 * why this matters.
 */

import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateAcademicProfileDto } from './dto/update-academic-profile.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('academic')
  getAcademic(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getAcademicProfile(user.id);
  }

  @Patch('academic')
  updateAcademic(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAcademicProfileDto) {
    return this.profileService.updateAcademicProfile(user.id, dto);
  }

  @Get('professional')
  getProfessional(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfessionalProfile(user.id);
  }

  @Patch('professional')
  updateProfessional(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.profileService.updateProfessionalProfile(user.id, dto);
  }
}
