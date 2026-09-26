// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotQueryDto
 *
 */

import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CopilotQueryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;

  /** Omit to start a new conversation; pass an existing id to continue one — CopilotService
   * always re-checks that the conversation actually belongs to the caller. */
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
