import { JobSourceAdapter, RawListing } from '../job-source-adapter.interface';
export declare class ScraperJobAdapter implements JobSourceAdapter {
    readonly name = "scraper";
    get enabled(): boolean;
    fetchListings(): Promise<RawListing[]>;
}
