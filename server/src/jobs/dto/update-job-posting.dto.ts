/**
 * InternSage — UpdateJobPostingDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-JOBS-DTO-002
 * File   : src/jobs/dto/update-job-posting.dto.ts
 *
 * Every field optional (PartialType) — a recruiter PATCHing a
 * posting sends only what changed. When `requiredSkillIds` IS
 * present, JobsService.update treats it as a full replacement of
 * the posting's required-skill set (delete all, recreate), not a
 * merge — see that method's comment.
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateJobPostingDto } from './create-job-posting.dto';

export class UpdateJobPostingDto extends PartialType(CreateJobPostingDto) {}
