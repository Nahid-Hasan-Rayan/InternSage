/**
 * InternSage — AggregatorController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-CTRL-001
 * File   : src/job-aggregator/aggregator.controller.ts
 *
 * @Public() because there is no end-user JWT on a Vercel Cron
 * call — CronSecretGuard is what actually protects this route.
 * See vercel.json's "crons" entry for the schedule.
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';
import { AggregatorService } from './aggregator.service';
@Controller('internal/jobs')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}
  @Public()
  @UseGuards(CronSecretGuard)
  @Get('aggregate')
  runOnce() {
    return this.aggregatorService.runOnce();
  }
}
