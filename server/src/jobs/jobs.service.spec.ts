/**
 * InternSage — JobsService unit tests
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-JOBS-TEST-001
 * File   : src/jobs/jobs.service.spec.ts
 *
 * Covers the two branches that actually protect something: a
 * recruiter can't silently create the same posting twice, and a
 * recruiter from Company A can never edit or close Company B's
 * posting just by guessing its id.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', ADMIN: 'ADMIN' },
  SkillCategory: { SOFTWARE: 'SOFTWARE', OTHER: 'OTHER' },
  Prisma: {},
}));

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobsService, computeDedupHash } from './jobs.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';

describe('JobsService', () => {
  let service: JobsService;
  let prisma: any;
  let analytics: any;

  beforeEach(() => {
    prisma = {
      recruiterProfile: { findUnique: jest.fn() },
      jobPosting: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    analytics = { record: jest.fn() };
    service = new JobsService(prisma, analytics);
  });

  const baseDto: CreateJobPostingDto = {
    title: 'Backend Intern',
    description: 'A' .repeat(30),
    requirementsText: 'NestJS and PostgreSQL',
    requiredSkillIds: ['skill-1'],
  } as CreateJobPostingDto;

  describe('computeDedupHash', () => {
    it('is stable for the same inputs regardless of case/whitespace', () => {
      const a = computeDedupHash('Backend Intern', 'company-1', 'https://x.com/job');
      const b = computeDedupHash('  backend intern  ', 'company-1', 'HTTPS://X.COM/JOB');
      expect(a).toBe(b);
    });

    it('differs when the company differs', () => {
      const a = computeDedupHash('Backend Intern', 'company-1');
      const b = computeDedupHash('Backend Intern', 'company-2');
      expect(a).not.toBe(b);
    });
  });

  describe('create', () => {
    it('rejects a non-recruiter caller', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue(null);
      await expect(service.create('user-1', baseDto)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an exact duplicate posting for the same company', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.jobPosting.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create('user-1', baseDto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.jobPosting.create).not.toHaveBeenCalled();
    });

    it('creates a posting scoped to the caller company when no duplicate exists', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.jobPosting.findUnique.mockResolvedValue(null);
      prisma.jobPosting.create.mockResolvedValue({ id: 'new-posting', companyId: 'company-1' });

      const result = await service.create('user-1', baseDto);

      expect(result.id).toBe('new-posting');
      expect(prisma.jobPosting.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ companyId: 'company-1' }) }),
      );
      expect(analytics.record).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'JOB_POSTING_CREATED' }),
      );
    });
  });

  describe('ownership scoping on update/deactivate', () => {
    it('throws NotFound when the posting does not exist', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.jobPosting.findUnique.mockResolvedValue(null);

      await expect(service.update('user-1', 'missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when the posting belongs to a different company', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.jobPosting.findUnique.mockResolvedValue({ id: 'p1', companyId: 'company-2' });

      await expect(service.deactivate('user-1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.jobPosting.update).not.toHaveBeenCalled();
    });

    it('allows deactivation when the posting belongs to the caller company', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.jobPosting.findUnique.mockResolvedValue({ id: 'p1', companyId: 'company-1' });
      prisma.jobPosting.update.mockResolvedValue({ id: 'p1', isActive: false });

      const result = await service.deactivate('user-1', 'p1');
      expect(result.isActive).toBe(false);
    });
  });
});
