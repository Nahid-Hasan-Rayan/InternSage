// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — AggregatorService unit tests
 *
 */
jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  JobSource: { API: 'API', RSS: 'RSS', SCRAPED: 'SCRAPED', MANUAL: 'MANUAL' },
  SkillCategory: { OTHER: 'OTHER' },
  Prisma: {},
}));
import { AggregatorService } from './aggregator.service';
describe('AggregatorService', () => {
  let prisma: any;
  let rssAdapter: any;
  let arbeitnowAdapter: any;
  let scraperAdapter: any;
  let service: AggregatorService;
  beforeEach(() => {
    prisma = {
      company: { upsert: jest.fn().mockResolvedValue({ id: 'company-1' }) },
      jobPosting: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'posting-1' }),
      },
      skill: { findMany: jest.fn().mockResolvedValue([]) },
      jobRequiredSkill: { create: jest.fn().mockResolvedValue({}) },
    };
    rssAdapter = { name: 'rss', enabled: true, fetchListings: jest.fn() };
    arbeitnowAdapter = { name: 'arbeitnow', enabled: false, fetchListings: jest.fn() };
    scraperAdapter = { name: 'scraper', enabled: false, fetchListings: jest.fn() };
    service = new AggregatorService(prisma, rssAdapter, arbeitnowAdapter, scraperAdapter);
  });
  const listing = {
    title: 'Software Intern',
    description: 'desc',
    requirementsText: 'desc',
    companyName: 'ExampleCo',
    companyEmailDomain: 'example.com',
    externalUrl: 'https://example.com/jobs/1',
    source: 'RSS',
  };
  it('skips disabled adapters entirely', async () => {
    rssAdapter.fetchListings.mockResolvedValue([]);
    const summary = await service.runOnce();
    expect(summary.adaptersRun).toEqual(['rss']);
    expect(scraperAdapter.fetchListings).not.toHaveBeenCalled();
    expect(arbeitnowAdapter.fetchListings).not.toHaveBeenCalled();
  });
  it('runs the Arbeitnow adapter alongside RSS once enabled', async () => {
    arbeitnowAdapter.enabled = true;
    rssAdapter.fetchListings.mockResolvedValue([]);
    arbeitnowAdapter.fetchListings.mockResolvedValue([{ ...listing, externalUrl: 'https://arbeitnow.example/2' }]);
    prisma.jobPosting.findUnique.mockResolvedValue(null);
    const summary = await service.runOnce();
    expect(summary.adaptersRun).toEqual(['rss', 'arbeitnow']);
    expect(summary.created).toBe(1);
  });
  it('creates a new posting for a listing not seen before', async () => {
    rssAdapter.fetchListings.mockResolvedValue([listing]);
    prisma.jobPosting.findUnique.mockResolvedValue(null);
    const summary = await service.runOnce();
    expect(summary.created).toBe(1);
    expect(summary.skippedDuplicates).toBe(0);
    expect(prisma.jobPosting.create).toHaveBeenCalledTimes(1);
  });
  it('skips a listing whose dedup hash already exists', async () => {
    rssAdapter.fetchListings.mockResolvedValue([listing]);
    prisma.jobPosting.findUnique.mockResolvedValue({ id: 'already-there' });
    const summary = await service.runOnce();
    expect(summary.created).toBe(0);
    expect(summary.skippedDuplicates).toBe(1);
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });
  it('resolves the company as unverified on first sight of a new domain', async () => {
    rssAdapter.fetchListings.mockResolvedValue([listing]);
    prisma.jobPosting.findUnique.mockResolvedValue(null);
    await service.runOnce();
    expect(prisma.company.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ verified: false }) }),
    );
  });

  describe('skill inference', () => {
    it('attaches a catalog skill whose name appears (case-insensitively) in the posting text', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-python', name: 'Python' }]);
      rssAdapter.fetchListings.mockResolvedValue([{ ...listing, description: 'Must know python and SQL.' }]);
      prisma.jobPosting.findUnique.mockResolvedValue(null);

      const summary = await service.runOnce();

      expect(prisma.jobRequiredSkill.create).toHaveBeenCalledWith({
        data: { jobPostingId: 'posting-1', skillId: 'skill-python' },
      });
      expect(summary.skillsAttached).toBe(1);
    });

    it('does not attach a skill whose name is not actually present in the posting text', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-rust', name: 'Rust' }]);
      rssAdapter.fetchListings.mockResolvedValue([{ ...listing, description: 'Frontend role using React.' }]);
      prisma.jobPosting.findUnique.mockResolvedValue(null);

      const summary = await service.runOnce();

      expect(prisma.jobRequiredSkill.create).not.toHaveBeenCalled();
      expect(summary.skillsAttached).toBe(0);
    });

    it('only matches whole words — "SQL" must not match inside "NoSQLDB"', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-sql', name: 'SQL' }]);
      rssAdapter.fetchListings.mockResolvedValue([{ ...listing, description: 'Experience with NoSQLDB required.' }]);
      prisma.jobPosting.findUnique.mockResolvedValue(null);

      const summary = await service.runOnce();

      expect(summary.skillsAttached).toBe(0);
    });

    it('excludes catalog entries shorter than the minimum length from inference entirely', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-r', name: 'R' }]);
      rssAdapter.fetchListings.mockResolvedValue([{ ...listing, description: 'Data role using R and statistics.' }]);
      prisma.jobPosting.findUnique.mockResolvedValue(null);

      const summary = await service.runOnce();

      expect(prisma.jobRequiredSkill.create).not.toHaveBeenCalled();
      expect(summary.skillsAttached).toBe(0);
    });

    it('never runs inference against a listing that was skipped as a duplicate', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-python', name: 'Python' }]);
      rssAdapter.fetchListings.mockResolvedValue([{ ...listing, description: 'python role' }]);
      prisma.jobPosting.findUnique.mockResolvedValue({ id: 'already-there' });

      await service.runOnce();

      expect(prisma.jobRequiredSkill.create).not.toHaveBeenCalled();
    });
  });
});
