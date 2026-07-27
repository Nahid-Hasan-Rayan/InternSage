/**
 * InternSage — ListJobPostingsDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-JOBS-DTO-003
 * File   : src/jobs/dto/list-job-postings.dto.ts
 */

import { Type } from 'class-transformer';
import { SkillCategory } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListJobPostingsDto {
  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  keyword?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  take: number = 20;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip: number = 0;
}
