/**
 * InternSage — UniversityController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-UNI-CTRL-001
 * File   : src/university/university.controller.ts
 *
 * Every route is @Roles(Role.UNIVERSITY) — the university identity
 * itself is always resolved server-side from the caller's own
 * UniversityAdminProfile (see UniversityService.resolveUniversityId),
 * never accepted as a client-supplied id.
 */
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UniversityService } from './university.service';
import { CreateEventDto, CreatePartnerDto } from './dto/university.dto';

@Controller('university')
@Roles(Role.UNIVERSITY)
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.universityService.getDashboard(user.id);
  }

  @Get('analytics')
  getAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.universityService.getAnalytics(user.id);
  }

  @Get('partners')
  getPartners(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('industry') industry?: string,
  ) {
    return this.universityService.getPartners(user.id, { search, industry });
  }

  @Post('partners')
  createPartner(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePartnerDto) {
    return this.universityService.createPartner(user.id, dto);
  }

  @Get('events')
  getEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.universityService.getEvents(user.id);
  }

  @Post('events')
  createEvent(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.universityService.createEvent(user.id, dto);
  }
}
