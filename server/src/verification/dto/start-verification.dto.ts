// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — StartVerificationDto
 *
 */
import { IsString } from 'class-validator';
export class StartVerificationDto {
  @IsString()
  userSkillId!: string;
}
