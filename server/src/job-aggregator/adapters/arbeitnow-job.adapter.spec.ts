/**
 * InternSage — ArbeitnowJobAdapter unit tests
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-TEST-002
 * File   : src/job-aggregator/adapters/arbeitnow-job.adapter.spec.ts
 *
 * fetchListings() itself (the actual fetch() call) is deliberately
 * not unit-tested here — same convention the RSS adapter already
 * follows in this codebase (only AggregatorService's orchestration
 * is tested with adapters mocked as pure interfaces). What IS real
 * decision logic, and is tested here, is the two exported pure
 * functions: which listings are even student-relevant, and the
 * safety property that a company domain can never collide with a
 * real one (see this file's sibling for why that matters).
 */
jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  JobSource: { API: 'API' },
  Prisma: {},
}));
import { looksStudentRelevant, syntheticCompanyDomain } from './arbeitnow-job.adapter';

describe('looksStudentRelevant', () => {
  it('accepts a listing whose title says internship', () => {
    expect(looksStudentRelevant({ title: 'Marketing Internship', tags: [], job_types: [], remote: false })).toBe(true);
  });

  it('accepts a listing tagged as a working-student role, regardless of title wording', () => {
    expect(
      looksStudentRelevant({ title: 'Software Developer', tags: ['working student'], job_types: [], remote: false }),
    ).toBe(true);
  });

  it('accepts any remote listing even with senior-sounding wording', () => {
    expect(looksStudentRelevant({ title: 'Senior Backend Engineer', tags: [], job_types: [], remote: true })).toBe(true);
  });

  it('rejects a senior, on-site listing with no student-relevant signal at all', () => {
    expect(
      looksStudentRelevant({ title: 'Head of Sales (DACH)', tags: ['management'], job_types: ['full-time'], remote: false }),
    ).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(looksStudentRelevant({ title: 'GRADUATE Analyst', tags: [], job_types: [], remote: false })).toBe(true);
  });
});

describe('syntheticCompanyDomain', () => {
  it('always ends in the IANA-reserved .invalid TLD, never a real one', () => {
    expect(syntheticCompanyDomain('Convidera GmbH')).toMatch(/\.arbeitnow\.invalid$/);
  });

  it('slugifies the company name deterministically (same name -> same domain, for upsert dedup)', () => {
    const a = syntheticCompanyDomain('Foo & Bar Solutions');
    const b = syntheticCompanyDomain('Foo & Bar Solutions');
    expect(a).toBe(b);
  });

  it('never produces an empty slug even for a name with no alphanumeric characters', () => {
    expect(syntheticCompanyDomain('!!!')).toBe('company.arbeitnow.invalid');
  });
});
