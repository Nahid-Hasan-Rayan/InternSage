/**
 * InternSage — University portal DTOs
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-UNI-DTO-001
 * File   : src/university/dto/university.dto.ts
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
