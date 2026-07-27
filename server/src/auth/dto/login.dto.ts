/**
 * InternSage — Login DTO
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUTH-DTO-002
 * File   : src/auth/dto/login.dto.ts
 *
 * Deliberately light validation on login (unlike register) — we
 * don't want to leak password-policy details to someone probing
 * the login endpoint, and the real check happens via bcrypt.compare.
 */

import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
