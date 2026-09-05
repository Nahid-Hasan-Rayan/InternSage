// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — RecruiterToolsService unit tests
 *
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', ADMIN: 'ADMIN' },
  ScorecardRecommendation: { STRONG_YES: 'STRONG_YES', YES: 'YES', NEUTRAL: 'NEUTRAL', NO: 'NO', STRONG_NO: 'STRONG_NO' },
  Prisma: {},
}));

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecruiterToolsService } from './recruiter-tools.service';

describe('RecruiterToolsService', () => {
  let prisma: any;
  let service: RecruiterToolsService;

  beforeEach(() => {
    prisma = {
      recruiterProfile: { findUnique: jest.fn() },
      recruiterWeights: { findUnique: jest.fn(), upsert: jest.fn() },
      interviewKit: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      application: { findUnique: jest.fn() },
      scorecard: { create: jest.fn(), findMany: jest.fn() },
    };
    service = new RecruiterToolsService(prisma);
  });

  describe('getMyWeights', () => {
    it('rejects a non-recruiter', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMyWeights('user-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('falls back to defaults when no row exists yet', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.recruiterWeights.findUnique.mockResolvedValue(null);
      const result = await service.getMyWeights('user-1');
      expect(result.skillsWeight).toBe(0.4);
    });
  });

  describe('createInterviewKit', () => {
    it('rejects a duplicate role for the same company', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.interviewKit.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createInterviewKit('user-1', { roleTitle: 'Backend Intern', criteria: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('submitScorecard ownership scoping', () => {
    const dto = {
      interviewKitId: 'kit-1',
      ratings: { communication: 4 },
      recommendation: 'YES' as const,
    };

    it('throws NotFound when the application does not exist', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.application.findUnique.mockResolvedValue(null);
      await expect(service.submitScorecard('user-1', 'app-1', dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when the application belongs to a different company', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.application.findUnique.mockResolvedValue({ id: 'app-1', jobPosting: { companyId: 'company-2' } });
      await expect(service.submitScorecard('user-1', 'app-1', dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.scorecard.create).not.toHaveBeenCalled();
    });

    it('throws Forbidden when the interview kit belongs to a different company than the application', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.application.findUnique.mockResolvedValue({ id: 'app-1', jobPosting: { companyId: 'company-1' } });
      prisma.interviewKit.findUnique.mockResolvedValue({ id: 'kit-1', companyId: 'company-2' });
      await expect(service.submitScorecard('user-1', 'app-1', dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.scorecard.create).not.toHaveBeenCalled();
    });

    it('creates a scorecard when both the application and kit belong to the caller company', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
      prisma.application.findUnique.mockResolvedValue({ id: 'app-1', jobPosting: { companyId: 'company-1' } });
      prisma.interviewKit.findUnique.mockResolvedValue({ id: 'kit-1', companyId: 'company-1' });
      prisma.scorecard.create.mockResolvedValue({ id: 'sc-1' });

      const result = await service.submitScorecard('user-1', 'app-1', dto);
      expect(result.id).toBe('sc-1');
      expect(prisma.scorecard.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ submittedById: 'user-1' }) }),
      );
    });
  });
});
