/**
 * InternSage — MatchingController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MATCH-CTRL-001
 * File   : src/matching/matching.controller.ts
 */
import { Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { PrismaService } from '../common/prisma/prisma.service';
import { MatchingService } from './matching.service';
@Controller()
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly prisma: PrismaService,
  ) {}
  private async resolveOwnStudentProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Only students have match scores.');
    }
    return profile.id;
  }
  @Roles(Role.STUDENT)
  @Get('matches')
  async getMyMatches(@CurrentUser() user: AuthenticatedUser) {
    const studentProfileId = await this.resolveOwnStudentProfileId(user.id);
    return this.matchingService.getMatchesForStudent(studentProfileId);
  }
  @Roles(Role.STUDENT)
  @Post('matches/recompute')
  async recomputeMine(@CurrentUser() user: AuthenticatedUser) {
    const studentProfileId = await this.resolveOwnStudentProfileId(user.id);
    return this.matchingService.recomputeForStudent(studentProfileId);
  }
  @Public()
  @UseGuards(CronSecretGuard)
  @Get('internal/matching/recompute')
  recomputeAll() {
    return this.matchingService.recomputeForAllStudents();
  }
}
