// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — University portal DTOs
 *
 */
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsDateString()
  date!: string;
}

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  industry!: string;
}
