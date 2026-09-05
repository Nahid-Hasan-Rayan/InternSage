// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — UniversityService unit tests
 *
 */
jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  ApplicationStatus: {
    APPLIED: 'APPLIED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    INTERVIEW: 'INTERVIEW',
    OFFER: 'OFFER',
    REJECTED: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
  },
  Prisma: {},
}));

import { ForbiddenException } from '@nestjs/common';
import { UniversityService } from './university.service';

describe('UniversityService', () => {
  let prisma: any;
  let service: UniversityService;

  const student = (userId: string, major: string | null, createdAt = new Date('2025-01-01')): any => ({
    userId,
    major,
    createdAt,
  });

  const application = (
    userId: string,
    status: string,
    opts: { title?: string; category?: string | null; company?: string; createdAt?: Date; updatedAt?: Date } = {},
  ): any => ({
    userId,
    status,
    createdAt: opts.createdAt ?? new Date(),
    updatedAt: opts.updatedAt ?? new Date(),
    jobPosting: {
      title: opts.title ?? 'Software Engineer Intern',
      category: opts.category ?? 'SOFTWARE',
      company: { name: opts.company ?? 'ExampleCo' },
    },
  });

  beforeEach(() => {
    prisma = {
      universityAdminProfile: { findUnique: jest.fn() },
      university: { findUnique: jest.fn() },
      studentProfile: { findMany: jest.fn() },
      application: { findMany: jest.fn() },
      universityPartner: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      universityEvent: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      salaryBenchmark: { findMany: jest.fn() },
    };
    service = new UniversityService(prisma);
  });

  const grantAdmin = () => {
    prisma.universityAdminProfile.findUnique.mockResolvedValue({ universityId: 'uni-1' });
  };

  describe('ownership scoping', () => {
    it('rejects any call from a user with no UniversityAdminProfile row', async () => {
      prisma.universityAdminProfile.findUnique.mockResolvedValue(null);
      await expect(service.getDashboard('stranger')).rejects.toThrow(ForbiddenException);
    });

    it('never queries any other model before resolving the admin profile', async () => {
      prisma.universityAdminProfile.findUnique.mockResolvedValue(null);
      await expect(service.getDashboard('stranger')).rejects.toThrow();
      expect(prisma.studentProfile.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getDashboard', () => {
    it('returns an honest zeroed shape for a cohort with no students yet', async () => {
      grantAdmin();
      prisma.university.findUnique.mockResolvedValue({ name: 'UTM' });
      prisma.studentProfile.findMany.mockResolvedValue([]);
      prisma.universityPartner.count.mockResolvedValue(0);
      prisma.universityEvent.count.mockResolvedValue(0);

      const result = await service.getDashboard('admin-1');

      expect(result.universityName).toBe('UTM');
      expect(result.stats.placementRatePct).toBe(0);
      expect(result.topCompanies).toEqual([]);
      expect(result.topProgrammes).toEqual([]);
      expect(result.recentActivity).toEqual([]);
      expect(prisma.application.findMany).not.toHaveBeenCalled();
    });

    it('computes placementRatePct as the fraction of students with at least one OFFER', async () => {
      grantAdmin();
      prisma.university.findUnique.mockResolvedValue({ name: 'UTM' });
      prisma.studentProfile.findMany.mockResolvedValue([
        student('s1', 'Computer Science'),
        student('s2', 'Computer Science'),
        student('s3', 'Mechanical Engineering'),
        student('s4', 'Mechanical Engineering'),
      ]);
      prisma.application.findMany.mockResolvedValue([
        application('s1', 'OFFER'),
        application('s2', 'REJECTED'),
        application('s3', 'APPLIED'),
      ]);
      prisma.universityPartner.count.mockResolvedValue(2);
      prisma.universityEvent.count.mockResolvedValue(1);

      const result = await service.getDashboard('admin-1');

      // 1 of 4 students has an OFFER -> 25%
      expect(result.stats.placementRatePct).toBe(25);
      expect(result.stats.activePartners).toBe(2);
      expect(result.stats.upcomingEvents).toBe(1);
    });

    it('counts a student only once toward placement even with multiple offers', async () => {
      grantAdmin();
      prisma.university.findUnique.mockResolvedValue({ name: 'UTM' });
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS')]);
      prisma.application.findMany.mockResolvedValue([
        application('s1', 'OFFER', { company: 'A' }),
        application('s1', 'OFFER', { company: 'B' }),
      ]);
      prisma.universityPartner.count.mockResolvedValue(0);
      prisma.universityEvent.count.mockResolvedValue(0);

      const result = await service.getDashboard('admin-1');

      expect(result.stats.placementRatePct).toBe(100);
      // But both real offers should still show up in topCompanies —
      // that's a company-level count, not a student-level one.
      expect(result.topCompanies).toHaveLength(2);
    });

    it('ranks topCompanies by real offer count, highest first', async () => {
      grantAdmin();
      prisma.university.findUnique.mockResolvedValue({ name: 'UTM' });
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS'), student('s2', 'CS'), student('s3', 'CS')]);
      prisma.application.findMany.mockResolvedValue([
        application('s1', 'OFFER', { company: 'Big Corp' }),
        application('s2', 'OFFER', { company: 'Big Corp' }),
        application('s3', 'OFFER', { company: 'Small Co' }),
      ]);
      prisma.universityPartner.count.mockResolvedValue(0);
      prisma.universityEvent.count.mockResolvedValue(0);

      const result = await service.getDashboard('admin-1');

      expect(result.topCompanies[0]).toEqual({ name: 'Big Corp', hires: 2 });
      expect(result.topCompanies[1]).toEqual({ name: 'Small Co', hires: 1 });
    });

    it('never invents a recentActivity line for an activity type that had zero events', async () => {
      grantAdmin();
      prisma.university.findUnique.mockResolvedValue({ name: 'UTM' });
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS', new Date('2020-01-01'))]);
      prisma.application.findMany.mockResolvedValue([]); // no applications at all
      prisma.universityPartner.count.mockResolvedValue(0);
      prisma.universityEvent.count.mockResolvedValue(0);

      const result = await service.getDashboard('admin-1');

      expect(result.recentActivity).toEqual([]);
    });
  });

  describe('getAnalytics', () => {
    it('estimates avgStartingSalaryRm from a matching seeded benchmark role, never a fabricated figure', async () => {
      grantAdmin();
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS')]);
      prisma.application.findMany.mockResolvedValue([
        application('s1', 'OFFER', { title: 'Software Engineer Intern' }),
      ]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([
        { role: 'Software Engineer', median: 10000 },
        { role: 'Data Analyst', median: 10000 },
      ]);

      const result = await service.getAnalytics('admin-1');

      expect(result.outcomes.avgStartingSalaryRm).toBe(10000);
    });

    it('returns 0 for avgStartingSalaryRm rather than guessing when no offer title matches any benchmark', async () => {
      grantAdmin();
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS')]);
      prisma.application.findMany.mockResolvedValue([application('s1', 'OFFER', { title: 'Astronaut Trainee' })]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([{ role: 'Software Engineer', median: 10000 }]);

      const result = await service.getAnalytics('admin-1');

      expect(result.outcomes.avgStartingSalaryRm).toBe(0);
    });

    it('returns 0 for avgStartingSalaryRm when there are no offers at all, without querying benchmarks', async () => {
      grantAdmin();
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS')]);
      prisma.application.findMany.mockResolvedValue([application('s1', 'APPLIED')]);

      const result = await service.getAnalytics('admin-1');

      expect(result.outcomes.avgStartingSalaryRm).toBe(0);
      expect(prisma.salaryBenchmark.findMany).not.toHaveBeenCalled();
    });

    it('computes avgOffersPerStudent as real offers divided by real cohort size', async () => {
      grantAdmin();
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS'), student('s2', 'CS')]);
      prisma.application.findMany.mockResolvedValue([application('s1', 'OFFER'), application('s2', 'APPLIED')]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([]);

      const result = await service.getAnalytics('admin-1');

      expect(result.outcomes.avgOffersPerStudent).toBe(0.5);
    });

    it('buckets byIndustry using real JobPosting.category values off actual offers', async () => {
      grantAdmin();
      prisma.studentProfile.findMany.mockResolvedValue([student('s1', 'CS'), student('s2', 'ME')]);
      prisma.application.findMany.mockResolvedValue([
        application('s1', 'OFFER', { category: 'SOFTWARE' }),
        application('s2', 'OFFER', { category: 'MECHANICAL' }),
      ]);
      prisma.salaryBenchmark.findMany.mockResolvedValue([]);

      const result = await service.getAnalytics('admin-1');

      expect(result.byIndustry).toEqual(
        expect.arrayContaining([
          { name: 'SOFTWARE', pct: 50 },
          { name: 'MECHANICAL', pct: 50 },
        ]),
      );
    });
  });

  describe('partners', () => {
    it('scopes createPartner to the caller\'s own resolved university, not a client-supplied id', async () => {
      grantAdmin();
      prisma.universityPartner.create.mockResolvedValue({ id: 'p1', name: 'Acme', industry: 'Tech' });

      await service.createPartner('admin-1', { name: 'Acme', industry: 'Tech' });

      expect(prisma.universityPartner.create).toHaveBeenCalledWith({
        data: { universityId: 'uni-1', name: 'Acme', industry: 'Tech' },
      });
    });
  });

  describe('events', () => {
    it('never fabricates registeredCount — always 0, since no RSVP model exists', async () => {
      grantAdmin();
      prisma.universityEvent.findMany.mockResolvedValue([
        { id: 'e1', title: 'Career Fair', date: new Date(Date.now() + 86400000) },
      ]);

      const result = await service.getEvents('admin-1');

      expect(result.items[0].registeredCount).toBe(0);
    });

    it('marks a future event as UPCOMING and a today-or-past event as ACTIVE', async () => {
      grantAdmin();
      prisma.universityEvent.findMany.mockResolvedValue([
        { id: 'future', title: 'Future Fair', date: new Date(Date.now() + 86400000) },
        { id: 'past', title: 'Past Fair', date: new Date(Date.now() - 86400000) },
      ]);

      const result = await service.getEvents('admin-1');

      expect(result.items.find((i: { id: string }) => i.id === 'future')?.status).toBe('UPCOMING');
      expect(result.items.find((i: { id: string }) => i.id === 'past')?.status).toBe('ACTIVE');
    });
  });
});
