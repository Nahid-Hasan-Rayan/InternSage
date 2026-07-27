/**
 * InternSage — RssJobAdapter
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AGG-002
 * File   : src/job-aggregator/adapters/rss-job.adapter.ts
 *
 * Pulls from whatever feed URLs are configured in JOB_RSS_FEED_URLS
 * (comma-separated). Disabled by default (empty env var) so a fresh
 * deploy doesn't silently start hitting external URLs nobody chose.
 * The XML parsing here is intentionally minimal — a handful of
 * regexes over standard RSS <item> blocks — rather than pulling in
 * a full XML parser for a feed shape this narrow.
 */
import { Injectable, Logger } from '@nestjs/common';
import { JobSource } from '@prisma/client';
import { JobSourceAdapter, RawListing } from '../job-source-adapter.interface';
function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
}
@Injectable()
export class RssJobAdapter implements JobSourceAdapter {
  readonly name = 'rss';
  private readonly logger = new Logger(RssJobAdapter.name);
  get enabled(): boolean {
    return this.feedUrls.length > 0;
  }
  private get feedUrls(): string[] {
    return (process.env.JOB_RSS_FEED_URLS ?? '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
  }
  async fetchListings(): Promise<RawListing[]> {
    if (!this.enabled) {
      return [];
    }
    const results: RawListing[] = [];
    for (const feedUrl of this.feedUrls) {
      try {
        const response = await fetch(feedUrl);
        if (!response.ok) {
          this.logger.warn(`Feed ${feedUrl} responded with ${response.status}`);
          continue;
        }
        const xml = await response.text();
        const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? [];
        for (const item of items) {
          const title = extractTag(item, 'title');
          const link = extractTag(item, 'link');
          const description = extractTag(item, 'description');
          if (!title || !link) {
            continue;
          }
          results.push({
            title,
            description: description || title,
            requirementsText: description || title,
            companyName: new URL(feedUrl).hostname,
            companyEmailDomain: new URL(feedUrl).hostname,
            externalUrl: link,
            source: JobSource.RSS,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch/parse feed ${feedUrl}: ${(error as Error).message}`);
      }
    }
    return results;
  }
}
