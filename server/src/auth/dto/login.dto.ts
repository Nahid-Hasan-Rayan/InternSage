// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Login DTO
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
