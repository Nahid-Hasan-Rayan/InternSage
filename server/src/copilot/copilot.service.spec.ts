// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotService unit tests
 *
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', UNIVERSITY: 'UNIVERSITY', ADMIN: 'ADMIN' },
  CopilotSender: { USER: 'USER', SAGE: 'SAGE' },
  Prisma: {},
}));

import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CopilotService } from './copilot.service';

function stubConversation(prisma: any) {
  prisma.copilotConversation = {
    create: jest.fn().mockResolvedValue({ id: 'conv-1', userId: 'user-1' }),
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
  };
  prisma.copilotMessage = {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
  };
  prisma.$transaction = jest.fn(async (ops: unknown[]) => ops);
}

describe('CopilotService', () => {
  let prisma: any;
  let audit: any;
  let universityService: any;
  let intentParser: any;
  let replyGenerator: any;
  let service: CopilotService;

  beforeEach(() => {
    prisma = {
      recruiterProfile: { findUnique: jest.fn() },
      studentProfile: { findUnique: jest.fn(), findMany: jest.fn() },
      skill: { findMany: jest.fn().mockResolvedValue([{ name: 'React' }, { name: 'Node' }]) },
      application: { findMany: jest.fn() },
      professionalProfile: {
        findMany: jest.fn(async (args: { select?: { headline?: boolean }; where?: { userId?: { in?: string[] } } }) => {
          // buildRecruiterContext calls this twice with two different shapes: the Step-3
          // skill/authenticity narrowing query (select: { userId: true }) and the
          // candidate-enrichment query (select includes headline/skills). Branch on that
          // shape so both calls get sensible defaults without the tests needing to know
          // call order — override with .mockResolvedValueOnce / reassign per test as needed.
          if (args?.select?.headline !== undefined) {
            const ids = args.where?.userId?.in ?? [];
            return ids.map((userId: string) => ({ userId, headline: null, user: { fullName: null }, skills: [] }));
          }
          return [];
        }),
        findUnique: jest.fn(),
      },
      matchScore: { findMany: jest.fn().mockResolvedValue([]) },
    };
    stubConversation(prisma);
    audit = { log: jest.fn() };
    universityService = { getDashboard: jest.fn(), getAnalytics: jest.fn() };
    intentParser = { name: 'stub', parse: jest.fn() };
    replyGenerator = { name: 'stub', generate: jest.fn().mockResolvedValue('Sage says something.') };
    service = new CopilotService(prisma, audit, universityService, intentParser, replyGenerator);
  });

  it('rejects a non-recruiter caller asking a RECRUITER-mode question', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue(null);
    await expect(service.query('user-1', Role.RECRUITER, 'who knows React')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('blocks a protected-characteristic question before any parsing, querying, or reply generation', async () => {
    const result = await service.query('user-1', Role.RECRUITER, 'only show me male students');

    expect(result.blocked).toBe(true);
    expect(result.data).toEqual({});
    expect(result.message.length).toBeGreaterThan(0);
    expect(intentParser.parse).not.toHaveBeenCalled();
    expect(replyGenerator.generate).not.toHaveBeenCalled();
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

    const result = await service.query('user-1', Role.RECRUITER, 'who is a CS student');

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jobPosting: { companyId: 'company-1' } } }),
    );
    expect((result.data.candidates as unknown[]).length).toBe(2);
    expect(result.message).toBe('Sage says something.');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'COPILOT_QUERY' }));
  });

  it('returns an empty pool (not an error) when the recruiter has no applicant pool yet', async () => {
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    intentParser.parse.mockResolvedValue({});
    prisma.application.findMany.mockResolvedValue([]);

    const result = await service.query('user-1', Role.RECRUITER, 'who knows React');
    expect(result.data.candidates).toEqual([]);
    expect(result.data.poolSize).toBe(0);
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
    prisma.professionalProfile.findMany.mockImplementationOnce(async () => [{ userId: 'student-a' }]);

    const result = await service.query('user-1', Role.RECRUITER, 'who knows React with authenticity of 70');

    const candidates = result.data.candidates as Array<{ userId: string }>;
    expect(candidates).toHaveLength(1);
    expect(candidates[0].userId).toBe('student-a');
  });

  it('attaches each candidate\'s skills to the data Sage actually sees — not just major/year/university', async () => {
    // Regression test: buildRecruiterContext used to hand the reply generator candidates
    // with no skills field at all, so a "who has Python?" question was structurally
    // unanswerable even though the underlying filter query worked correctly.
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    intentParser.parse.mockResolvedValue({});
    prisma.application.findMany.mockResolvedValue([{ userId: 'student-a' }]);
    prisma.studentProfile.findMany.mockResolvedValue([
      { userId: 'student-a', major: 'CS', year: 3, university: { name: 'UTM' } },
    ]);
    prisma.professionalProfile.findMany.mockImplementationOnce(async () => [
      {
        userId: 'student-a',
        headline: 'Backend-leaning SE student',
        user: { fullName: 'Aisyah Rahman' },
        skills: [{ skill: { name: 'Python' }, verified: true }, { skill: { name: 'Docker' }, verified: false }],
      },
    ]);

    const result = await service.query('user-1', Role.RECRUITER, 'who has Python');

    const candidates = result.data.candidates as Array<{ fullName: string | null; skills: string[]; verifiedSkills: string[] }>;
    expect(candidates[0].fullName).toBe('Aisyah Rahman');
    expect(candidates[0].skills).toEqual(['Python', 'Docker']);
    expect(candidates[0].verifiedSkills).toEqual(['Python']);
  });

  it('grounds a STUDENT question in their own applications and matches, not the applicant-pool path', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ id: 'sp-1', userId: 'user-2' });
    prisma.application.findMany.mockResolvedValue([]);
    prisma.matchScore.findMany.mockResolvedValue([]);
    prisma.professionalProfile.findUnique.mockResolvedValue({ headline: 'Aspiring engineer', skills: [] });

    const result = await service.query('user-2', Role.STUDENT, 'how am I doing');

    expect(prisma.recruiterProfile.findUnique).not.toHaveBeenCalled();
    expect(result.data.applications).toEqual([]);
    expect(result.message).toBe('Sage says something.');
  });

  it('grounds a UNIVERSITY question in UniversityService, never a second computation of the same numbers', async () => {
    universityService.getDashboard.mockResolvedValue({ universityName: 'UTM', stats: { placementRatePct: 40 } });
    universityService.getAnalytics.mockResolvedValue({ outcomes: {}, byFaculty: [], byIndustry: [] });

    const result = await service.query('user-3', Role.UNIVERSITY, 'how is placement trending');

    expect(universityService.getDashboard).toHaveBeenCalledWith('user-3');
    expect((result.data as any).universityName).toBe('UTM');
  });
});
