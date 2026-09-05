// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — JobsController
 *
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JobsService } from './jobs.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { ListJobPostingsDto } from './dto/list-job-postings.dto';
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
  @Get()
  findMany(@Query() query: ListJobPostingsDto) {
    return this.jobsService.findMany(query);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }
  @Roles(Role.RECRUITER)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobPostingDto) {
    return this.jobsService.create(user.id, dto);
  }
  @Roles(Role.RECRUITER)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobPostingDto,
  ) {
    return this.jobsService.update(user.id, id, dto);
  }
  @Roles(Role.RECRUITER)
  @Delete(':id')
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.jobsService.deactivate(user.id, id);
  }
}
