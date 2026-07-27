/**
 * InternSage — AggregatorService unit tests
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-TEST-001
 * File   : src/job-aggregator/aggregator.service.spec.ts
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
  let scraperAdapter: any;
  let service: AggregatorService;
  beforeEach(() => {
    prisma = {
      company: { upsert: jest.fn().mockResolvedValue({ id: 'company-1' }) },
      jobPosting: { findUnique: jest.fn(), create: jest.fn() },
    };
    rssAdapter = { name: 'rss', enabled: true, fetchListings: jest.fn() };
    scraperAdapter = { name: 'scraper', enabled: false, fetchListings: jest.fn() };
    service = new AggregatorService(prisma, rssAdapter, scraperAdapter);
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
});
