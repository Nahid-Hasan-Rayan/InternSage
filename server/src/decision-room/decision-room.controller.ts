// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — DecisionRoomController
 *
 * Route shapes match web/src/lib/internsage-api.ts exactly —
 * getDecisionRoomTrends()/getDecisionRoomInsights() were written
 * against these contracts before this controller existed.
 *
 * `trends` is deliberately NOT @Roles(Role.STUDENT)-restricted:
 * it's aggregate, non-personal market data (nothing here is any one
 * student's own information), so any authenticated role can read
 * it — global JwtAuthGuard still means it's never anonymous. Only
 * `insights` needs a specific role, because it resolves "whose
 * data" from the authenticated user and that resolution only makes
 * sense for a student.
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { DecisionRoomService } from './decision-room.service';

@Controller('decision-room')
export class DecisionRoomController {
  constructor(private readonly decisionRoomService: DecisionRoomService) {}

  @Get('trends')
  getTrends() {
    return this.decisionRoomService.getTrends();
  }

  @Roles(Role.STUDENT)
  @Get('insights')
  getInsights(@CurrentUser() user: AuthenticatedUser) {
    return this.decisionRoomService.getInsightsForStudent(user.id);
  }

  // Vercel Cron only — see CronSecretGuard's header comment. Add to
  // server/vercel.json's "crons" array (not present in this handoff
  // export, but exists in the real repo):
  //   { "path": "/api/decision-room/internal/recompute-trends", "schedule": "0 3 * * 1" }
  // (Mondays 03:00 UTC — weekly, matching the frontend comment's
  // "batch-computed weekly, never live-per-request".)
  @Public()
  @UseGuards(CronSecretGuard)
  @Get('internal/recompute-trends')
  recomputeTrends() {
    return this.decisionRoomService.recomputeSkillDemand();
  }
}
