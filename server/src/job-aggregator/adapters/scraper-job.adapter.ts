// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — ScraperJobAdapter (disabled by default)
 *
 * Kept as its own adapter, never merged into RssJobAdapter, so it
 * can be reviewed, rate-limited, and enabled/disabled independently
 * of the legitimate feed path. Only ever turned on for a named
 * source with no RSS/API alternative, and only after that source's
 * robots.txt and terms of service have actually been checked — this
 * class intentionally does nothing until that review has happened
 * and JOB_SCRAPER_ENABLED is deliberately set to "true".
 */
import { Injectable } from '@nestjs/common';
import { JobSourceAdapter, RawListing } from '../job-source-adapter.interface';
@Injectable()
export class ScraperJobAdapter implements JobSourceAdapter {
  readonly name = 'scraper';
  get enabled(): boolean {
    return process.env.JOB_SCRAPER_ENABLED === 'true';
  }
  async fetchListings(): Promise<RawListing[]> {
    if (!this.enabled) {
      return [];
    }
    // No source-specific scraper has been reviewed and added yet —
    // enabling the flag alone must not start silently scraping
    // something nobody vetted.
    return [];
  }
}
