// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CvController
 *
 */

import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CvService } from './cv.service';
import { AddEducationDto, AddExperienceDto, AddProjectDto, AddSkillDto } from './dto/cv.dto';

@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get()
  getFullCv(@CurrentUser() user: AuthenticatedUser) {
    return this.cvService.getFullCv(user.id);
  }

  @Get('skills')
  listSkillCatalog() {
    return this.cvService.listSkillCatalog();
  }

  @Post('skills')
  addSkill(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddSkillDto) {
    return this.cvService.addSkill(user.id, dto);
  }

  @Delete('skills/:skillId')
  removeSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    return this.cvService.removeSkill(user.id, skillId);
  }

  @Post('experiences')
  addExperience(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddExperienceDto) {
    return this.cvService.addExperience(user.id, dto);
  }

  @Post('educations')
  addEducation(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddEducationDto) {
    return this.cvService.addEducation(user.id, dto);
  }

  @Post('projects')
  addProject(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddProjectDto) {
    return this.cvService.addProject(user.id, dto);
  }
}
