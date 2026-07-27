/**
 * InternSage — AuthService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUTH-SVC-001
 * File   : src/auth/auth.service.ts
 *
 * This is where "verification is structural, not manual review"
 * (Master Blueprint §5, Module 1) actually gets implemented:
 * whether a new account is `verified` is decided entirely by
 * whether its email domain matches a whitelisted University or
 * Company row — there is no admin approval step in this path.
 *
 * STUDENT vs RECRUITER are treated asymmetrically on purpose:
 *   - A student whose university isn't yet a partner can still
 *     register (verified = false, limited downstream access) —
 *     we don't want to lock a student out entirely.
 *   - A recruiter whose company isn't a whitelisted tenant is
 *     REJECTED outright. Letting an unverified recruiter into the
 *     system at all is a much higher-risk mistake (spam, fraud,
 *     a fake "recruiter" contacting real students) than a student
 *     signing up early — companies must be onboarded as tenants
 *     before their staff can register.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_SALT_ROUNDS = 12;

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  verified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly analytics: AnalyticsService,
  ) {}

  private extractDomain(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) {
      throw new BadRequestException('Email address is malformed.');
    }
    return domain;
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    verified: boolean;
  }): SafeUser {
    // Never let a passwordHash leak out through an API response,
    // even accidentally — callers only ever get this shape back.
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      verified: user.verified,
    };
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: SafeUser }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Deliberately vague — do not confirm which account already
      // exists in a way that helps an attacker enumerate emails.
      throw new ConflictException('Registration could not be completed with the provided details.');
    }

    const domain = this.extractDomain(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    if (dto.role === Role.RECRUITER) {
      const company = await this.prisma.company.findUnique({ where: { emailDomain: domain } });
      if (!company) {
        throw new BadRequestException(
          'Your organisation is not yet a partner on InternSage. Contact us to onboard your company before registering.',
        );
      }

      const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const created = await tx.user.create({
          data: {
            email: dto.email,
            fullName: dto.fullName,
            passwordHash,
            role: Role.RECRUITER,
            verified: true, // domain matched a whitelisted company — verified by construction
          },
        });
        await tx.recruiterProfile.create({
          data: { userId: created.id, companyId: company.id },
        });
        return created;
      });

      void this.analytics.record({ type: 'AUTH_REGISTER', userId: user.id, userRole: Role.RECRUITER });
      return this.issueSession(user);
    }

    // STUDENT path
    const university = await this.prisma.university.findUnique({ where: { emailDomain: domain } });

    const user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          role: Role.STUDENT,
          verified: Boolean(university),
        },
      });
      await tx.studentProfile.create({
        data: { userId: created.id, universityId: university?.id },
      });
      // Every student gets both profile halves from day one, even
      // if the professional side starts empty — this is what makes
      // the academic ⇄ professional switch a UI concept rather than
      // something requiring a data migration later.
      await tx.professionalProfile.create({
        data: { userId: created.id },
      });
      return created;
    });

    void this.analytics.record({ type: 'AUTH_REGISTER', userId: user.id, userRole: Role.STUDENT });
    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Same generic error whether the email doesn't exist or the
    // password is wrong — never let a login endpoint confirm
    // which emails have accounts.
    const invalidCredentials = () => new UnauthorizedException('Invalid email or password.');

    if (!user) {
      void this.analytics.record({ type: 'AUTH_LOGIN_FAILED', metadata: { reason: 'no_such_user' } });
      throw invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      void this.analytics.record({
        type: 'AUTH_LOGIN_FAILED',
        userId: user.id,
        userRole: user.role,
        metadata: { reason: 'wrong_password' },
      });
      throw invalidCredentials();
    }

    void this.analytics.record({ type: 'AUTH_LOGIN', userId: user.id, userRole: user.role });
    return this.issueSession(user);
  }

  private issueSession(user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    verified: boolean;
  }): { accessToken: string; user: SafeUser } {
    const accessToken = this.jwtService.sign({ sub: user.id, role: user.role });
    return { accessToken, user: this.toSafeUser(user) };
  }
}
