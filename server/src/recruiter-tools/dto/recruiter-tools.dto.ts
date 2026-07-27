/**
 * InternSage — Recruiter tooling DTOs
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-RECTOOLS-DTO-001
 * File   : src/recruiter-tools/dto/recruiter-tools.dto.ts
 */

import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ScorecardRecommendation } from '@prisma/client';

/** Weights need not sum to 1 — MatchingService uses them as raw multipliers, not percentages. */
export class UpdateRecruiterWeightsDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  skillsWeight!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  projectsWeight!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  authenticityWeight!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  softSkillsWeight!: number;
}

class CriterionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;
}

export class CreateInterviewKitDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  roleTitle!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria!: CriterionDto[];
}

export class SubmitScorecardDto {
  @IsString()
  interviewKitId!: string;

  // Keyed by criterion label -> 1-5 rating. Kept as a flexible
  // object rather than a fixed DTO shape since criteria are
  // recruiter-defined per InterviewKit, not a fixed set InternSage
  // controls.
  @IsObject()
  ratings!: Record<string, number>;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;

  @IsEnum(ScorecardRecommendation)
  recommendation!: ScorecardRecommendation;
}
