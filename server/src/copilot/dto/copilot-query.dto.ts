/**
 * InternSage — CopilotQueryDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-COPILOT-DTO-001
 * File   : src/copilot/dto/copilot-query.dto.ts
 */

import { IsString, MaxLength, MinLength } from 'class-validator';

export class CopilotQueryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;
}
