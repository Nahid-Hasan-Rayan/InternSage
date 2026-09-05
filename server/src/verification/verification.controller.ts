// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — VerificationController
 *
 * Not part of the originally pasted code — VerificationService came
 * without a controller/module, so this wires it up following the
 * same pattern as MatchingController: student-facing routes plus an
 * @Public() + CronSecretGuard internal route for the scheduled decay
 * job (see vercel.json's "crons" entry).
 */

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { VerificationService } from './verification.service';
import { StartVerificationDto } from './dto/start-verification.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Roles(Role.STUDENT)
  @Post('sessions')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartVerificationDto) {
    return this.verificationService.startSession(user.id, dto);
  }

  @Roles(Role.STUDENT)
  @Post('sessions/:sessionId/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitVerificationDto,
  ) {
    return this.verificationService.submitSession(user.id, sessionId, dto);
  }

  @Public()
  @UseGuards(CronSecretGuard)
  @Get('internal/decay')
  decay() {
    return this.verificationService.decayAllScores();
  }
}
