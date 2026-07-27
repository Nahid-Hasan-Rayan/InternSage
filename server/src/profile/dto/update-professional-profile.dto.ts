/**
 * InternSage — Update Professional Profile DTO
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-PROFILE-DTO-002
 * File   : src/profile/dto/update-professional-profile.dto.ts
 */

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProfileVisibility } from '@prisma/client';

export class UpdateProfessionalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;
}
