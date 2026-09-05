// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — ApplicationsController
 *
 */

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationStatusDto } from './dto/application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post(':jobPostingId')
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobPostingId', ParseUUIDPipe) jobPostingId: string,
  ) {
    return this.applicationsService.apply(user.id, jobPostingId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.listMine(user.id);
  }

  @Get('recruiter')
  listForRecruiter(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.listForRecruiter(user.id);
  }

  @Patch(':applicationId/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.id, user.role, applicationId, dto.status);
  }
}
