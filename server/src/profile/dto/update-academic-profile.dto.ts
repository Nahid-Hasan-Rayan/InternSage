// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Update Academic Profile DTO
 *
 */

import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAcademicProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  major?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}
