// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — SendMessageDto
 *
 */

import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
