/**
 * InternSage — SendMessageDto
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MSG-DTO-001
 * File   : src/messaging/dto/send-message.dto.ts
 */

import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
