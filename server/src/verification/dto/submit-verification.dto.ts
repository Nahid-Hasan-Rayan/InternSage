/**
 * InternSage — SubmitVerificationDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-VERIFY-DTO-002
 * File   : src/verification/dto/submit-verification.dto.ts
 */
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';
export class SubmitVerificationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers!: number[];
}
