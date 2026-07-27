import { JobSourceAdapter, RawListing } from '../job-source-adapter.interface';
export declare class RssJobAdapter implements JobSourceAdapter {
    readonly name = "rss";
    private readonly logger;
    get enabled(): boolean;
    private get feedUrls();
    fetchListings(): Promise<RawListing[]>;
}
