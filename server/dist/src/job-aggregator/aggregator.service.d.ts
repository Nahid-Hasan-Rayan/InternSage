import { PrismaService } from '../common/prisma/prisma.service';
import { RssJobAdapter } from './adapters/rss-job.adapter';
import { ScraperJobAdapter } from './adapters/scraper-job.adapter';
export interface AggregationSummary {
    adaptersRun: string[];
    fetched: number;
    created: number;
    skippedDuplicates: number;
}
export declare class AggregatorService {
    private readonly prisma;
    private readonly logger;
    private readonly adapters;
    constructor(prisma: PrismaService, rssAdapter: RssJobAdapter, scraperAdapter: ScraperJobAdapter);
    runOnce(): Promise<AggregationSummary>;
}
