// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — AuthService unit tests
 *
 * These tests target exactly the branches called out as the
 * highest-value thing to test in the Build Plan (Phase 1, step
 * 1.9): the domain-verification logic is the entire trust
 * foundation of the platform, so it gets tested first and most
 * thoroughly — everything downstream (matching, recruiter trust,
 * the audit trail) assumes this layer is correct.
 *
 * `@prisma/client` is mocked at the module level rather than
 * generated, so these tests run against pure business logic with
 * no real database — fast, deterministic, and independent of
 * any particular environment's network access.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', UNIVERSITY: 'UNIVERSITY', ADMIN: 'ADMIN' },
  ProfileVisibility: {
    ALL_VERIFIED_RECRUITERS: 'ALL_VERIFIED_RECRUITERS',
    APPLIED_ONLY: 'APPLIED_ONLY',
    DRAFT: 'DRAFT',
  },
  SkillCategory: { OTHER: 'OTHER' },
  Prisma: {},
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let analytics: any;

  const baseRegisterDto: RegisterDto = {
    email: 'nahid@student.utm.my',
    password: 'Str0ngPassword!',
    role: 'STUDENT' as any,
    fullName: 'Nahid Hasan Rayan',
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      university: { findUnique: jest.fn() },
      company: { findUnique: jest.fn() },
      $transaction: jest.fn(),    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    analytics = { record: jest.fn().mockResolvedValue(undefined) };
    service = new AuthService(prisma, jwt, analytics);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register — student domain verification', () => {
    it('verifies a student whose email domain matches a whitelisted university', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.university.findUnique.mockResolvedValue({ id: 'uni-1', name: 'UTM' });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-1',
              email: baseRegisterDto.email,
              fullName: baseRegisterDto.fullName,
              role: 'STUDENT',
              verified: true,
            }),
          },
          studentProfile: { create: jest.fn().mockResolvedValue({}) },
          professionalProfile: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await service.register(baseRegisterDto);

      expect(result.user.verified).toBe(true);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(prisma.university.findUnique).toHaveBeenCalledWith({
        where: { emailDomain: 'student.utm.my' },
      });
    });

    it('registers a student with an unmatched domain as unverified, not rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.university.findUnique.mockResolvedValue(null); // no matching university
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-2',
              email: 'nahid@some-unlisted-school.edu',
              fullName: baseRegisterDto.fullName,
              role: 'STUDENT',
              verified: false,
            }),
          },
          studentProfile: { create: jest.fn().mockResolvedValue({}) },
          professionalProfile: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await service.register({
        ...baseRegisterDto,
        email: 'nahid@some-unlisted-school.edu',
      });

      // Deliberately NOT rejected — a student isn't locked out just
      // because their institution isn't yet a partner.
      expect(result.user.verified).toBe(false);
    });
  });

  describe('register — recruiter domain verification', () => {
    it('rejects a recruiter whose company domain is not a whitelisted tenant', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue(null); // no matching company

      await expect(
        service.register({
          ...baseRegisterDto,
          email: 'recruiter@unknown-startup.io',
          role: 'RECRUITER' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      // The strictest assertion in this suite: an unverified
      // recruiter must never reach $transaction — i.e. no User row
      // is ever created for them. This is the behaviour the whole
      // "recruiters are rejected, not just flagged" design rests on.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('verifies and creates a recruiter profile when the company domain matches', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue({ id: 'company-1', name: 'Padu Analytics' });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-3',
              email: 'recruiter@padu.com',
              fullName: 'Recruiter Name',
              role: 'RECRUITER',
              verified: true,
            }),
          },
          recruiterProfile: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await service.register({
        ...baseRegisterDto,
        email: 'recruiter@padu.com',
        role: 'RECRUITER' as any,
      });

      expect(result.user.verified).toBe(true);
    });
  });

  describe('register — university domain verification', () => {
    it('rejects a university admin whose institution domain is not a whitelisted tenant', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.university.findUnique.mockResolvedValue(null); // no matching university

      await expect(
        service.register({
          ...baseRegisterDto,
          email: 'admin@unlisted-college.edu',
          role: 'UNIVERSITY' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      // Same strictest assertion as the recruiter case: an
      // unmatched institution must never reach $transaction.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('verifies and creates a university admin profile when the institution domain matches', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.university.findUnique.mockResolvedValue({ id: 'uni-1', name: 'UTM' });
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-4',
              email: 'admin@utm.my',
              fullName: 'Career Centre Admin',
              role: 'UNIVERSITY',
              verified: true,
            }),
          },
          universityAdminProfile: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await service.register({
        ...baseRegisterDto,
        email: 'admin@utm.my',
        role: 'UNIVERSITY' as any,
      });

      expect(result.user.verified).toBe(true);
    });
  });

  describe('register — duplicate accounts', () => {
    it('refuses to register an email that already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(baseRegisterDto)).rejects.toThrow(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const existingUser = {
      id: 'user-1',
      email: 'nahid@student.utm.my',
      fullName: 'Nahid Hasan Rayan',
      passwordHash: 'hashed-password',
      role: 'STUDENT',
      verified: true,
    };

    it('issues a token for correct credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto: LoginDto = { email: existingUser.email, password: 'Str0ngPassword!' };
      const result = await service.login(dto);

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe(existingUser.email);
      // Never leaks the hash back to the caller.
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('rejects an incorrect password with a generic message', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: existingUser.email, password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a non-existent email with the same generic message as a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      let firstError: unknown;
      try {
        await service.login({ email: 'nobody@nowhere.com', password: 'anything' });
      } catch (err) {
        firstError = err;
      }

      expect(firstError).toBeInstanceOf(UnauthorizedException);
      expect((firstError as UnauthorizedException).message).toBe('Invalid email or password.');
    });
  });
});
