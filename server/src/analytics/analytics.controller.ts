/**
 * InternSage — AnalyticsController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-ANALYTICS-CTRL-001
 * File   : src/analytics/analytics.controller.ts
 *
 * Two distinct trust boundaries in one controller, kept clearly
 * separate:
 *   - POST /analytics/event — any authenticated user, writes ONE
 *     event scoped to their own userId (never a client-supplied
 *     one — same ownership discipline as profile.service.ts).
 *   - GET  /analytics/admin/... — @Roles(Role.ADMIN) only. This is
 *     the "how is the product doing" dashboard data: traffic,
 *     errors, signup/login funnel. A student or recruiter has no
 *     legitimate reason to see aggregate platform telemetry.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';
import { AnalyticsQueryDto, ErrorLogQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('event')
  @HttpCode(HttpStatus.ACCEPTED)
  async trackEvent(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    await this.analytics.record({
      type: dto.type as unknown as Parameters<AnalyticsService['record']>[0]['type'],
      userId: user.id,
      userRole: user.role,
      metadata: dto.metadata,
    });
    return { accepted: true };
  }

  @Roles(Role.ADMIN)
  @Get('admin/summary')
  getSummary(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getSummary(query.days);
  }

  @Roles(Role.ADMIN)
  @Get('admin/routes')
  getTopRoutes(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getTopRoutes(query.days);
  }

  @Roles(Role.ADMIN)
  @Get('admin/traffic')
  getTraffic(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getTraffic(query.days);
  }

  @Roles(Role.ADMIN)
  @Get('admin/errors/top')
  getTopErrors(@Query() query: ErrorLogQueryDto) {
    return this.analytics.getTopErrors(query.days, query.limit);
  }

  @Roles(Role.ADMIN)
  @Get('admin/errors/recent')
  getRecentErrors(@Query() query: ErrorLogQueryDto) {
    return this.analytics.getRecentErrors(query.days, query.limit);
  }
}
