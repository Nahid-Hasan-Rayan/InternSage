/**
 * InternSage — Register DTO
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUTH-DTO-001
 * File   : src/auth/dto/register.dto.ts
 *
 * Validation here is the first security checkpoint: malformed
 * input is rejected before it ever reaches AuthService.
 */

import { IsEmail, IsEnum, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// At least one lowercase letter, one uppercase letter, one digit,
// minimum 8 characters. Deliberately not more exotic than this —
// overly strict composition rules push people toward predictable
// patterns; length plus basic variety is the better trade-off.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export class RegisterDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @MaxLength(255)
  email!: string;

  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes — enforce the ceiling explicitly
  @Matches(PASSWORD_RULE, {
    message: 'Password must include an uppercase letter, a lowercase letter, and a digit.',
  })
  password!: string;

  // ADMIN is intentionally excluded — nobody can self-register as
  // an admin. Admin accounts are provisioned out-of-band.
  @IsEnum([Role.STUDENT, Role.RECRUITER], {
    message: 'Role must be either STUDENT or RECRUITER.',
  })
  role!: Role;

  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;
}
