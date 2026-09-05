// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MatchingService unit tests
 *
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', ADMIN: 'ADMIN' },
  Prisma: {},
}));

import { MatchingService } from './matching.service';

describe('MatchingService', () => {
  let prisma: any;
  let analytics: any;
  let service: MatchingService;

  beforeEach(() => {
    prisma = {
      studentProfile: { findUnique: jest.fn(), findMany: jest.fn() },
      professionalProfile: { findUnique: jest.fn() },
      jobPosting: { findMany: jest.fn() },
      recruiterWeights: { findUnique: jest.fn() },
      matchScore: { upsert: jest.fn(), findMany: jest.fn() },
    };
    analytics = { record: jest.fn() };
    service = new MatchingService(prisma, analytics);
  });

  it('reports matched and missing skills as a real set intersection, not text parsing', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: 'Aspiring backend engineer',
      skills: [{ skill: { name: 'NestJS' }, authenticityScore: 80 }],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      {
        id: 'job-1',
        companyId: 'company-1',
        title: 'Backend Intern',
        requirementsText: 'NestJS and PostgreSQL',
        requiredSkills: [{ skill: { name: 'NestJS' } }, { skill: { name: 'PostgreSQL' } }],
      },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue(null);
    prisma.matchScore.upsert.mockImplementation(({ create }: any) => Promise.resolve(create));

    const results = await service.recomputeForStudent('student-1');

    expect(results).toHaveLength(1);
    expect(results[0].matchedSkills).toEqual(['nestjs']);
    expect(results[0].missingSkills).toEqual(['postgresql']);
    expect(results[0].score).toBeGreaterThanOrEqual(0);
    expect(results[0].score).toBeLessThanOrEqual(100);
  });

  it('scores a full skill match higher than a zero-overlap posting', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: 'React and Node developer',
      skills: [{ skill: { name: 'React' }, authenticityScore: 90 }, { skill: { name: 'Node' }, authenticityScore: 90 }],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      {
        id: 'job-full-match',
        companyId: 'company-1',
        title: 'Frontend Intern',
        requirementsText: 'React and Node',
        requiredSkills: [{ skill: { name: 'React' } }, { skill: { name: 'Node' } }],
      },
      {
        id: 'job-no-match',
        companyId: 'company-1',
        title: 'Mechanical Intern',
        requirementsText: 'CAD and SolidWorks',
        requiredSkills: [{ skill: { name: 'CAD' } }, { skill: { name: 'SolidWorks' } }],
      },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue(null);
    prisma.matchScore.upsert.mockImplementation(({ create }: any) => Promise.resolve(create));

    const [fullMatch, noMatch] = await service.recomputeForStudent('student-1');

    expect(fullMatch.score).toBeGreaterThan(noMatch.score);
  });

  it('never writes a score outside the 0-100 range even with no required skills', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: '',
      skills: [],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      {
        id: 'job-1',
        companyId: 'company-1',
        title: 'Generalist Intern',
        requirementsText: 'anything',
        requiredSkills: [],
      },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue(null);
    prisma.matchScore.upsert.mockImplementation(({ create }: any) => Promise.resolve(create));

    const [result] = await service.recomputeForStudent('student-1');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('reads a company recruiter-weights row when present instead of only defaults', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: '',
      skills: [],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      { id: 'job-1', companyId: 'company-1', title: 't', requirementsText: 'r', requiredSkills: [] },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue({
      skillsWeight: 1,
      projectsWeight: 0,
      authenticityWeight: 0,
      softSkillsWeight: 0,
    });
    prisma.matchScore.upsert.mockImplementation(({ create }: any) => Promise.resolve(create));

    await service.recomputeForStudent('student-1');
    expect(prisma.recruiterWeights.findUnique).toHaveBeenCalledWith({ where: { companyId: 'company-1' } });
  });

  it('looks up weights once per distinct company, not once per posting', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: '',
      skills: [],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      { id: 'job-1', companyId: 'company-1', title: 't1', requirementsText: 'r', requiredSkills: [] },
      { id: 'job-2', companyId: 'company-1', title: 't2', requirementsText: 'r', requiredSkills: [] },
      { id: 'job-3', companyId: 'company-1', title: 't3', requirementsText: 'r', requiredSkills: [] },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue(null);
    prisma.matchScore.upsert.mockImplementation(({ create }: any) => Promise.resolve(create));

    const results = await service.recomputeForStudent('student-1');

    expect(results).toHaveLength(3);
    // Three postings, same company -> one DB round-trip, not three.
    expect(prisma.recruiterWeights.findUnique).toHaveBeenCalledTimes(1);
  });

  it('still looks up weights separately for genuinely different companies', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: '',
      skills: [],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      { id: 'job-1', companyId: 'company-1', title: 't1', requirementsText: 'r', requiredSkills: [] },
      { id: 'job-2', companyId: 'company-2', title: 't2', requirementsText: 'r', requiredSkills: [] },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue(null);
    prisma.matchScore.upsert.mockImplementation(({ create }: any) => Promise.resolve(create));

    await service.recomputeForStudent('student-1');

    expect(prisma.recruiterWeights.findUnique).toHaveBeenCalledTimes(2);
  });

  it('fires match-score writes concurrently rather than awaiting each one before starting the next', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.professionalProfile.findUnique.mockResolvedValue({
      id: 'pp-1',
      headline: '',
      skills: [],
      experiences: [],
      projects: [],
    });
    prisma.jobPosting.findMany.mockResolvedValue([
      { id: 'job-1', companyId: 'company-1', title: 't1', requirementsText: 'r', requiredSkills: [] },
      { id: 'job-2', companyId: 'company-1', title: 't2', requirementsText: 'r', requiredSkills: [] },
      { id: 'job-3', companyId: 'company-1', title: 't3', requirementsText: 'r', requiredSkills: [] },
    ]);
    prisma.recruiterWeights.findUnique.mockResolvedValue(null);

    let inFlight = 0;
    let maxInFlight = 0;
    prisma.matchScore.upsert.mockImplementation(async ({ create }: any) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      // Yield without a real timer — proves these three calls were
      // all outstanding at once, not one finishing before the next
      // was even issued (which a sequential `for` loop would show as
      // maxInFlight === 1).
      await Promise.resolve();
      inFlight -= 1;
      return create;
    });

    const results = await service.recomputeForStudent('student-1');

    expect(results).toHaveLength(3);
    expect(maxInFlight).toBeGreaterThan(1);
  });
});
