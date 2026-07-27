/**
 * InternSage — CreateJobPostingDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-JOBS-DTO-001
 * File   : src/jobs/dto/create-job-posting.dto.ts
 *
 * `requiredSkillIds` is required and non-empty (not optional) —
 * MatchScore's matchedSkills/missingSkills come from a real set
 * intersection against JobRequiredSkill (see MatchingService's
 * header comment). A posting with no structured skills can't be
 * explainably matched against, so the API doesn't allow creating
 * one that way.
 */

import { SkillCategory } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateJobPostingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  requirementsText!: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  location?: string;

  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  // Optional — a recruiter posting natively on InternSage has no
  // external listing to link back to. Aggregated postings always
  // set this (see AggregatorService); manual ones may leave it out.
  @IsUrl()
  @IsOptional()
  externalUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requiredSkillIds!: string[];
}
