// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Update Professional Profile DTO
 *
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
