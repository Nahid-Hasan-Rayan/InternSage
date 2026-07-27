/**
 * InternSage — RecruiterToolsController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-RECTOOLS-CTRL-001
 * File   : src/recruiter-tools/recruiter-tools.controller.ts
 */

import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RecruiterToolsService } from './recruiter-tools.service';
import { UpdateRecruiterWeightsDto, CreateInterviewKitDto, SubmitScorecardDto } from './dto/recruiter-tools.dto';

@Controller('recruiter-tools')
@Roles(Role.RECRUITER)
export class RecruiterToolsController {
  constructor(private readonly recruiterToolsService: RecruiterToolsService) {}

  @Get('weights')
  getWeights(@CurrentUser() user: AuthenticatedUser) {
    return this.recruiterToolsService.getMyWeights(user.id);
  }

  @Put('weights')
  updateWeights(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateRecruiterWeightsDto) {
    return this.recruiterToolsService.upsertMyWeights(user.id, dto);
  }

  @Post('interview-kits')
  createKit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInterviewKitDto) {
    return this.recruiterToolsService.createInterviewKit(user.id, dto);
  }

  @Get('interview-kits')
  listKits(@CurrentUser() user: AuthenticatedUser) {
    return this.recruiterToolsService.listMyInterviewKits(user.id);
  }

  @Post('applications/:applicationId/scorecards')
  submitScorecard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Body() dto: SubmitScorecardDto,
  ) {
    return this.recruiterToolsService.submitScorecard(user.id, applicationId, dto);
  }

  @Get('applications/:applicationId/scorecards')
  listScorecards(@CurrentUser() user: AuthenticatedUser, @Param('applicationId') applicationId: string) {
    return this.recruiterToolsService.listScorecardsForApplication(user.id, applicationId);
  }
}
