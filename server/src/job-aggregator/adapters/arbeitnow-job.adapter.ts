/**
 * InternSage — ArbeitnowJobAdapter
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-004
 * File   : src/job-aggregator/adapters/arbeitnow-job.adapter.ts
 *
 * Arbeitnow (arbeitnow.com/blog/job-board-api) publishes a public,
 * no-auth, no-key JSON API the author explicitly built and
 * documents for external reuse — a legitimate feed source, the same
 * class of thing RssJobAdapter already pulls from, not a scrape of
 * a site that never agreed to be read this way. Disabled by default
 * (JOB_ARBEITNOW_ENABLED must literally be "true"), same pattern as
 * ScraperJobAdapter, so a fresh deploy never silently starts hitting
 * an external URL nobody chose.
 *
 * Two things this adapter deliberately does that a blind scrape of
 * "the internet" wouldn't:
 *
 *  1. FILTERS for InternSage's actual audience. Arbeitnow's board is
 *     general (mostly DACH/EU, every seniority level) — importing it
 *     unfiltered would flood a student-facing feed with senior
 *     German-language executive roles nobody here can use. Every
 *     listing is checked by looksStudentRelevant() before being
 *     returned: it has to actually look like an internship/
 *     working-student/junior/graduate role, or be remote, to make
 *     it in. That's a deterministic keyword check against fields
 *     Arbeitnow itself provides (title/tags/job_types/remote) —
 *     never an LLM guess, same "structured, not guessed" principle
 *     JobRequiredSkill's own schema comment already states.
 *
 *  2. NEVER invents a real company's email domain. AggregatorService
 *     upserts a Company row keyed on emailDomain, and that same
 *     field is what auto-verifies a RECRUITER at registration (see
 *     AuthService.register's domain-whitelist check) — so guessing
 *     "convidera-gmbh.com" from a company name, and being right,
 *     would let a real employee at a real company walk into an
 *     auto-verified recruiter account for a listing InternSage
 *     itself created without that company's knowledge. Every
 *     Arbeitnow-sourced company instead gets a synthetic domain
 *     under the IANA-reserved `.invalid` TLD (RFC 2606) — guaranteed
 *     to never be any real person's actual email domain, so it can
 *     never accidentally satisfy that check. These companies stay
 *     unverified forever, which is correct: nobody at InternSage has
 *     actually vetted them.
 */
import { Injectable, Logger } from '@nestjs/common';
import { JobSource } from '@prisma/client';
import { JobSourceAdapter, RawListing } from '../job-source-adapter.interface';

// Use node-fetch as a safe fallback for serverless environments (like Vercel)
import fetch from 'node-fetch';

const API_BASE = 'https://www.arbeitnow.com/api/job-board-api';
/** Hard cap so one aggregation run can never turn into an unbounded
 * crawl — Arbeitnow returns ~100 listings/page; new dedup-skipped
 * postings on later runs mean this doesn't need to be high to reach
 * everything new since the last run. */
const MAX_PAGES = 3;

interface ArbeitnowJob {
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links?: { next?: string | null };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const RELEVANCE_KEYWORDS = [
  'intern',
  'internship',
  'praktik', // German: Praktikant/Praktikum
  'working student',
  'werkstudent',
  'trainee',
  'graduate',
  'junior',
  'entry',
  'student job',
  'apprentice',
  'ausbildung', // German: apprenticeship
];

/** Deterministic, keyword-only — see this file's header comment for
 * why this is a check against fields the source already provides,
 * never an LLM's judgment call. */
export function looksStudentRelevant(job: Pick<ArbeitnowJob, 'title' | 'tags' | 'job_types' | 'remote'>): boolean {
  const haystack = [job.title, ...(job.tags ?? []), ...(job.job_types ?? [])].join(' ').toLowerCase();
  if (RELEVANCE_KEYWORDS.some((kw) => haystack.includes(kw))) {
    return true;
  }
  // A remote role doesn't need seniority wording to be usable by a
  // student — location is the barrier that filters it, not level.
  return job.remote === true;
}

/** See this file's header comment (§2) for why this is `.invalid`,
 * never a guessed real domain. */
export function syntheticCompanyDomain(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'company'}.arbeitnow.invalid`;
}

@Injectable()
export class ArbeitnowJobAdapter implements JobSourceAdapter {
  readonly name = 'arbeitnow';
  private readonly logger = new Logger(ArbeitnowJobAdapter.name);

  get enabled(): boolean {
    return process.env.JOB_ARBEITNOW_ENABLED === 'true';
  }

  async fetchListings(): Promise<RawListing[]> {
    if (!this.enabled) {
      return [];
    }

    const results: RawListing[] = [];
    let url: string | null = API_BASE;
    let pagesFetched = 0;

    while (url && pagesFetched < MAX_PAGES) {
      pagesFetched += 1;
      let payload: ArbeitnowResponse;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          this.logger.warn(`Arbeitnow responded with ${response.status}`);
          break;
        }
        payload = (await response.json()) as ArbeitnowResponse;
      } catch (error) {
        this.logger.warn(`Failed to fetch/parse Arbeitnow: ${(error as Error).message}`);
        break;
      }

      for (const job of payload.data ?? []) {
        if (!looksStudentRelevant(job)) {
          continue;
        }
        const description = stripHtml(job.description ?? '');
        results.push({
          title: job.title,
          description: description || job.title,
          requirementsText: description || job.title,
          companyName: job.company_name,
          companyEmailDomain: syntheticCompanyDomain(job.company_name),
          location: job.location,
          externalUrl: job.url,
          source: JobSource.API,
        });
      }

      url = payload.links?.next ?? null;
    }

    return results;
  }
}