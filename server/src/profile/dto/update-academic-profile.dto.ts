/**
 * InternSage — Update Academic Profile DTO
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-PROFILE-DTO-001
 * File   : src/profile/dto/update-academic-profile.dto.ts
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
