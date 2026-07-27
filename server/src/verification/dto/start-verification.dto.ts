/**
 * InternSage — StartVerificationDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-VERIFY-DTO-001
 * File   : src/verification/dto/start-verification.dto.ts
 */
import { IsString } from 'class-validator';
export class StartVerificationDto {
  @IsString()
  userSkillId!: string;
}
