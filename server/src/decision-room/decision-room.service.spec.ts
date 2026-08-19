/**
 * InternSage — DecisionRoomService unit tests
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-DECISION-TEST-001
 * File   : src/decision-room/decision-room.service.spec.ts
 *
 * Covers the actual decision logic, matching this project's own
 * testing convention (ARCHITECTURE.md/Master Blueprint Phase 9):
 * skill-demand counting is a real aggregation, not a passthrough,
 * so it's tested against overlapping postings; changePct has a
 * divide-by-zero edge case (a skill appearing for the first time)
 * that's easy to get wrong; and every insight is a distinct
 * decision boundary (verified vs not, trending vs steady, applied
 * recently vs not) that a passing test suite should pin down.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', ADMIN: 'ADMIN' },
  Prisma: {},
}));

import { DecisionRoomService } from './decision-room.service';

describe('DecisionRoomService', () => {
  let prisma: any;
  let service: DecisionRoomService;

  beforeEach(() => {
    prisma = {
      jobRequiredSkill: { findMany: jest.fn() },
      skillDemandSnapshot: { upsert: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() },
      salaryBenchmark: { findMany: jest.fn() },
      studentProfile: { findUnique: jest.fn() },
      professionalProfile: { findUnique: jest.fn() },
      application: { findMany: jest.fn() },
      matchScore: { findMany: jest.fn() },
    };
    service = new DecisionRoomService(prisma);
  });

  describe('recomputeSkillDemand', () => {
    it('counts each skill once per active-posting requirement and upserts one snapshot per skill', async () => {
      prisma.jobRequiredSkill.findMany.mockResolvedValue([
        { skillId: 'react' },
        { skillId: 'react' },
        { skillId: 'sql' },
      ]);
      prisma.skillDemandSnapshot.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.recomputeSkillDemand();

      expect(prisma.jobRequiredSkill.findMany).toHaveBeenCalledWith({
        where: { jobPosting: { isActive: true } },
        select: { skillId: true },
      });
      expect(prisma.skillDemandSnapshot.upsert).toHaveBeenCalledTimes(2);
      const upsertedForReact = prisma.skillDemandSnapshot.upsert.mock.calls.find(
        (call: any[]) => call[0].create.skillId === 'react',
      );
      expect(upsertedForReact[0].create.postingCount).toBe(2);
      expect(result.skillsProcessed).toBe(2);
    });

    it('prunes snapshots older than the retention window on every run', async () => {
      prisma.jobRequiredSkill.findMany.mockResolvedValue([]);
      prisma.skillDemandSnapshot.deleteMany.mockResolvedValue({ count: 3 });

      await service.recomputeSkillDemand();

      expect(prisma.skillDemandSnapshot.deleteMany).toHaveBeenCalledTimes(1);
      const arg = prisma.skillDemandSnapshot.deleteMany.mock.calls[0][0];
      expect(arg.where.computedAt.lt).toBeInstanceOf(Date);
    });
  });

  describe('getTrends', () => {
    it('returns an empty-but-valid shape when nothing has been computed yet', async () => {
      prisma.skillDemandSnapshot.findMany.mockResolvedValue([]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([]);

      const result = await service.getTrends();

      expect(result.skillDemand).toEqual([]);
      expect(result.salaryBands).toEqual([]);
      expect(typeof result.updatedAt).toBe('string');
    });

    it('computes changePct from the two most recent points of the same skill', async () => {
      prisma.skillDemandSnapshot.findMany.mockResolvedValue([
        { skillId: 's1', period: '2026-W30', postingCount: 4, computedAt: new Date('2026-07-27'), skill: { name: 'Python' } },
        { skillId: 's1', period: '2026-W31', postingCount: 5, computedAt: new Date('2026-08-03'), skill: { name: 'Python' } },
      ]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([]);

      const result = await service.getTrends();

      expect(result.skillDemand).toHaveLength(1);
      expect(result.skillDemand[0].skillName).toBe('Python');
      expect(result.skillDemand[0].points).toEqual([
        { period: '2026-W30', value: 4 },
        { period: '2026-W31', value: 5 },
      ]);
      // (5 - 4) / 4 = 25%
      expect(result.skillDemand[0].changePct).toBe(25);
    });

    it('treats a brand-new skill (no prior period) as a defined, non-crashing changePct rather than dividing by zero', async () => {
      prisma.skillDemandSnapshot.findMany.mockResolvedValue([
        { skillId: 's1', period: '2026-W31', postingCount: 3, computedAt: new Date(), skill: { name: 'Rust' } },
      ]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([]);

      const result = await service.getTrends();

      expect(result.skillDemand[0].changePct).toBe(0);
    });

    it('ranks skills by current demand, highest first', async () => {
      prisma.skillDemandSnapshot.findMany.mockResolvedValue([
        { skillId: 'low', period: '2026-W31', postingCount: 1, computedAt: new Date(), skill: { name: 'Low' } },
        { skillId: 'high', period: '2026-W31', postingCount: 9, computedAt: new Date(), skill: { name: 'High' } },
      ]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([]);

      const result = await service.getTrends();

      expect(result.skillDemand.map((s) => s.skillName)).toEqual(['High', 'Low']);
    });

    it('passes salary benchmarks straight through in the exact contract shape', async () => {
      prisma.skillDemandSnapshot.findMany.mockResolvedValue([]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([
        { role: 'Software Engineer', region: 'Malaysia', p25: 3500, median: 10000, p75: 17000, source: 'x', asOf: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.getTrends();

      expect(result.salaryBands).toEqual([
        { role: 'Software Engineer', region: 'Malaysia', p25: 3500, median: 10000, p75: 17000 },
      ]);
    });
  });

  describe('getInsightsForStudent', () => {
    const baseSetup = () => {
      prisma.studentProfile.findUnique.mockResolvedValue({ id: 'student-profile-1', userId: 'user-1' });
      prisma.professionalProfile.findUnique.mockResolvedValue({ skills: [] });
      prisma.application.findMany.mockResolvedValue([]);
      prisma.matchScore.findMany.mockResolvedValue([]);
    };

    it('returns an empty list — never fabricated insights — when the student has no StudentProfile row', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      const result = await service.getInsightsForStudent('ghost-user');

      expect(result).toEqual([]);
      expect(prisma.professionalProfile.findUnique).not.toHaveBeenCalled();
    });

    it('emits a positive verification insight when every claimed skill is verified', async () => {
      baseSetup();
      prisma.professionalProfile.findUnique.mockResolvedValue({
        skills: [{ verified: true }, { verified: true }],
      });

      const result = await service.getInsightsForStudent('user-1');

      const v = result.find((i) => i.id === 'verification');
      expect(v?.tone).toBe('positive');
      expect(v?.text).toContain('All 2');
    });

    it('emits an attention verification insight when some claimed skills are unverified', async () => {
      baseSetup();
      prisma.professionalProfile.findUnique.mockResolvedValue({
        skills: [{ verified: true }, { verified: false }, { verified: false }],
      });

      const result = await service.getInsightsForStudent('user-1');

      const v = result.find((i) => i.id === 'verification');
      expect(v?.tone).toBe('attention');
      expect(v?.text).toContain('2 of your 3');
    });

    it('omits the verification insight entirely for a student with no claimed skills yet', async () => {
      baseSetup();

      const result = await service.getInsightsForStudent('user-1');

      expect(result.find((i) => i.id === 'verification')).toBeUndefined();
    });

    it('emits a positive match-trend insight when the latest score is well above the prior average', async () => {
      baseSetup();
      prisma.matchScore.findMany.mockResolvedValue([
        { score: 50, missingSkills: [] },
        { score: 52, missingSkills: [] },
        { score: 80, missingSkills: [] },
      ]);

      const result = await service.getInsightsForStudent('user-1');

      const trend = result.find((i) => i.id === 'match-trend');
      expect(trend?.tone).toBe('positive');
    });

    it('emits an attention match-trend insight when the latest score drops well below the prior average', async () => {
      baseSetup();
      prisma.matchScore.findMany.mockResolvedValue([
        { score: 80, missingSkills: [] },
        { score: 82, missingSkills: [] },
        { score: 50, missingSkills: [] },
      ]);

      const result = await service.getInsightsForStudent('user-1');

      const trend = result.find((i) => i.id === 'match-trend');
      expect(trend?.tone).toBe('attention');
    });

    it('never emits a match-trend insight from a single match — there is no "trend" yet', async () => {
      baseSetup();
      prisma.matchScore.findMany.mockResolvedValue([{ score: 80, missingSkills: [] }]);

      const result = await service.getInsightsForStudent('user-1');

      expect(result.find((i) => i.id === 'match-trend')).toBeUndefined();
    });

    it('names the most frequent missing skill across matches, not just the first one seen', async () => {
      baseSetup();
      prisma.matchScore.findMany.mockResolvedValue([
        { score: 60, missingSkills: ['SQL', 'Docker'] },
        { score: 65, missingSkills: ['SQL'] },
      ]);

      const result = await service.getInsightsForStudent('user-1');

      const gap = result.find((i) => i.id === 'skill-gap');
      expect(gap?.text).toContain('"SQL"');
      expect(gap?.text).toContain('2 of 2');
    });

    it('emits a positive momentum insight after a recent application', async () => {
      baseSetup();
      prisma.application.findMany.mockResolvedValue([{ createdAt: new Date() }]);

      const result = await service.getInsightsForStudent('user-1');

      const momentum = result.find((i) => i.id === 'momentum');
      expect(momentum?.tone).toBe('positive');
    });

    it('emits an attention momentum insight when the student has matches but has never applied', async () => {
      baseSetup();
      prisma.matchScore.findMany.mockResolvedValue([{ score: 70, missingSkills: [] }]);

      const result = await service.getInsightsForStudent('user-1');

      const momentum = result.find((i) => i.id === 'momentum');
      expect(momentum?.tone).toBe('attention');
      expect(momentum?.text).toContain('no applications yet');
    });

    it('emits no momentum insight for a brand-new student with neither matches nor applications', async () => {
      baseSetup();

      const result = await service.getInsightsForStudent('user-1');

      expect(result.find((i) => i.id === 'momentum')).toBeUndefined();
    });
  });
});
