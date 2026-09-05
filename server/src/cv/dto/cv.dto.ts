// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CV DTOs
 *
 * Grouped in one file since each is small — split out if any of
 * these grows past a handful of fields.
 */

import { IsDateString, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class AddSkillDto {
  @IsString()
  @MaxLength(100)
  name!: string;
}

export class AddExperienceDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(200)
  organization!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class AddEducationDto {
  @IsString()
  @MaxLength(200)
  institution!: string;

  @IsString()
  @MaxLength(200)
  degree!: string;

  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear!: number;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  endYear?: number;
}

export class AddProjectDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Deliberately generic — a repo link, a CAD file, a case-writeup;
  // see the field-aware CV reasoning in the Master Blueprint.
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portfolioUrl?: string;
}
