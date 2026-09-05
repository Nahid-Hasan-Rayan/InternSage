// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — SubmitVerificationDto
 *
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
