// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotQueryDto
 *
 */

import { IsString, MaxLength, MinLength } from 'class-validator';

export class CopilotQueryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;
}
