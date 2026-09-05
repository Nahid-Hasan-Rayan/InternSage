// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — AggregatorService
 *
 * A company row is resolved (or created, unverified) per listing
 * from `companyEmailDomain` — an aggregated posting's company
 * starts unverified, which is deliberate: domain verification for
 * companies is earned through the recruiter registration flow, not
 * granted automatically just because a listing mentioned a name.
 *
 * Skill-tagging (added alongside ArbeitnowJobAdapter): a listing
 * pulled from an external source has no explicit skill selection
 * the way a recruiter's manual posting does, so without this step
 * every aggregated posting would have zero JobRequiredSkill rows —
 * meaning MatchingService's actual skill-intersection signal (the
 * trustworthy part of a match score) would find nothing to work
 * with on any aggregated job, no matter how good the profile fit
 * really is. attachInferredSkills() closes that gap the same way
 * JobRequiredSkill's own schema comment insists on: a deterministic,
 * auditable check (exact, word-bounded name match against the
 * existing Skill catalog) — never an LLM guess at what a posting
 * "probably" wants.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { computeDedupHash } from '../jobs/jobs.service';
import { RssJobAdapter } from './adapters/rss-job.adapter';
import { ArbeitnowJobAdapter } from './adapters/arbeitnow-job.adapter';
import { ScraperJobAdapter } from './adapters/scraper-job.adapter';
import { JobSourceAdapter } from './job-source-adapter.interface';

export interface AggregationSummary {
  adaptersRun: string[];
  fetched: number;
  created: number;
  skippedDuplicates: number;
  skillsAttached: number;
}

/** Skill names shorter than this are skipped for inference entirely
 * — a 1–2 character catalog entry (if one ever existed) would match
 * inside unrelated words far too often for a plain word-boundary
 * check to stay trustworthy. */
const MIN_SKILL_NAME_LENGTH = 3;

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);
  private readonly adapters: JobSourceAdapter[];

  constructor(
    private readonly prisma: PrismaService,
    rssAdapter: RssJobAdapter,
    arbeitnowAdapter: ArbeitnowJobAdapter,
    scraperAdapter: ScraperJobAdapter,
  ) {
    // Legitimate sources first, scraping fallback last — order here
    // is deliberate even though all currently run independently.
    this.adapters = [rssAdapter, arbeitnowAdapter, scraperAdapter];
  }

  async runOnce(): Promise<AggregationSummary> {
    const summary: AggregationSummary = {
      adaptersRun: [],
      fetched: 0,
      created: 0,
      skippedDuplicates: 0,
      skillsAttached: 0,
    };

    // Loaded once per run, reused for every posting created this
    // run — the catalog is small enough that this is cheaper and
    // simpler than a per-posting query, and keeps every posting in
    // one run checked against exactly the same snapshot of skills.
    const skillCatalog = (await this.prisma.skill.findMany({ select: { id: true, name: true } })).filter(
      (s: { id: string; name: string }) => s.name.length >= MIN_SKILL_NAME_LENGTH,
    );

    for (const adapter of this.adapters) {
      if (!adapter.enabled) {
        continue;
      }
      summary.adaptersRun.push(adapter.name);
      const listings = await adapter.fetchListings();
      summary.fetched += listings.length;
      for (const listing of listings) {
        const company = await this.prisma.company.upsert({
          where: { emailDomain: listing.companyEmailDomain },
          update: {},
          create: {
            name: listing.companyName,
            emailDomain: listing.companyEmailDomain,
            verified: false,
          },
        });
        const dedupHash = computeDedupHash(listing.title, company.id, listing.externalUrl);
        const existing = await this.prisma.jobPosting.findUnique({ where: { dedupHash } });
        if (existing) {
          summary.skippedDuplicates += 1;
          continue;
        }
        const created = await this.prisma.jobPosting.create({
          data: {
            companyId: company.id,
            title: listing.title,
            description: listing.description,
            requirementsText: listing.requirementsText,
            location: listing.location,
            category: listing.category,
            source: listing.source,
            externalUrl: listing.externalUrl,
            dedupHash,
          },
        });
        summary.created += 1;

        const text = `${listing.title} ${listing.description} ${listing.requirementsText}`;
        summary.skillsAttached += await this.attachInferredSkills(created.id, text, skillCatalog);
      }
    }

    this.logger.log(`Aggregation run: ${JSON.stringify(summary)}`);
    return summary;
  }

  private async attachInferredSkills(
    jobPostingId: string,
    text: string,
    skillCatalog: Array<{ id: string; name: string }>,
  ): Promise<number> {
    let attached = 0;
    for (const skill of skillCatalog) {
      const pattern = new RegExp(`\\b${escapeForRegex(skill.name)}\\b`, 'i');
      if (!pattern.test(text)) {
        continue;
      }
      try {
        await this.prisma.jobRequiredSkill.create({
          data: { jobPostingId, skillId: skill.id },
        });
        attached += 1;
      } catch (error) {
        // Unique constraint on [jobPostingId, skillId] — shouldn't
        // happen within one posting (skillCatalog has no duplicate
        // names), but never let a tagging hiccup fail the posting
        // that's already been created.
        this.logger.warn(`Could not attach skill ${skill.id} to ${jobPostingId}: ${(error as Error).message}`);
      }
    }
    return attached;
  }
}
