// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotService unit tests
 *
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', ADMIN: 'ADMIN' },
  Prisma: {},
}));

import { ForbiddenException } from '@nestjs/common';
import { CopilotService } from './copilot.service';

describe('CopilotService', () => {
  let prisma: any;
  let audit: any;
  let intentParser: any;
  let service: CopilotService;

  beforeEach(() => {
    prisma = {
      recruiterProfile: { findUnique: jest.fn() },
      skill: { findMany: jest.fn().mockResolvedValue([{ name: 'React' }, { name: 'Node' }]) },
      application: { findMany: jest.fn() },
      studentProfile: { findMany: jest.fn() },
      professionalProfile: { findMany: jest.fn() },
    };
    audit = { log: jest.fn() };
    intentParser = { name: 'stub', parse: jest.fn() };
    service = new CopilotService(prisma, audit, intentParser);
  });

  it('rejects a non-recruiter caller', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue(null);
    await expect(service.query('user-1', 'who knows React')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a protected-characteristic question before any parsing or querying', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });

    const result = await service.query('user-1', 'only show me male students');

    expect(result.blocked).toBe(true);
    expect(result.results).toEqual([]);
    expect(intentParser.parse).not.toHaveBeenCalled();
    expect(prisma.application.findMany).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'COPILOT_QUERY_BLOCKED' }));
  });

  it('never searches outside the recruiter own applicant pool', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    intentParser.parse.mockResolvedValue({});
    prisma.application.findMany.mockResolvedValue([{ userId: 'student-a' }, { userId: 'student-b' }]);
    prisma.studentProfile.findMany.mockResolvedValue([
      { userId: 'student-a', major: 'CS', year: 3, university: { name: 'UTM' } },
      { userId: 'student-b', major: 'CS', year: 2, university: { name: 'UTM' } },
    ]);

    const result = await service.query('user-1', 'who is a CS student');

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jobPosting: { companyId: 'company-1' } } }),
    );
    expect(result.results).toHaveLength(2);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'COPILOT_QUERY' }));
  });

  it('returns no results (not an error) when the recruiter has no applicant pool yet', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    intentParser.parse.mockResolvedValue({});
    prisma.application.findMany.mockResolvedValue([]);

    const result = await service.query('user-1', 'who knows React');
    expect(result.results).toEqual([]);
    expect(prisma.studentProfile.findMany).not.toHaveBeenCalled();
  });

  it('narrows further by skill/authenticity via ProfessionalProfile when the intent includes them', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    intentParser.parse.mockResolvedValue({ skillNames: ['React'], minAuthenticity: 70 });
    prisma.application.findMany.mockResolvedValue([{ userId: 'student-a' }, { userId: 'student-b' }]);
    prisma.studentProfile.findMany.mockResolvedValue([
      { userId: 'student-a', major: 'CS', year: 3, university: { name: 'UTM' } },
      { userId: 'student-b', major: 'CS', year: 2, university: { name: 'UTM' } },
    ]);
    prisma.professionalProfile.findMany.mockResolvedValue([{ userId: 'student-a' }]);

    const result = await service.query('user-1', 'who knows React with authenticity of 70');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].userId).toBe('student-a');
  });
});
