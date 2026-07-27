/**
 * InternSage — AggregatorService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-SVC-001
 * File   : src/job-aggregator/aggregator.service.ts
 *
 * A company row is resolved (or created, unverified) per listing
 * from `companyEmailDomain` — an aggregated posting's company
 * starts unverified, which is deliberate: domain verification for
 * companies is earned through the recruiter registration flow, not
 * granted automatically just because a listing mentioned a name.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { computeDedupHash } from '../jobs/jobs.service';
import { RssJobAdapter } from './adapters/rss-job.adapter';
import { ScraperJobAdapter } from './adapters/scraper-job.adapter';
import { JobSourceAdapter } from './job-source-adapter.interface';
export interface AggregationSummary {
  adaptersRun: string[];
  fetched: number;
  created: number;
  skippedDuplicates: number;
}
@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);
  private readonly adapters: JobSourceAdapter[];
  constructor(
    private readonly prisma: PrismaService,
    rssAdapter: RssJobAdapter,
    scraperAdapter: ScraperJobAdapter,
  ) {
    // Legitimate source first, scraping fallback last — order here
    // is deliberate even though both currently run independently.
    this.adapters = [rssAdapter, scraperAdapter];
  }
  async runOnce(): Promise<AggregationSummary> {
    const summary: AggregationSummary = {
      adaptersRun: [],
      fetched: 0,
      created: 0,
      skippedDuplicates: 0,
    };
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
        await this.prisma.jobPosting.create({
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
      }
    }
    this.logger.log(`Aggregation run: ${JSON.stringify(summary)}`);
    return summary;
  }
}
