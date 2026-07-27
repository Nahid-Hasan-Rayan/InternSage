import { AnalyticsService } from '../../analytics/analytics.service';
import type { ApplicationStatusChangedEvent } from '../applications.service';
export declare class ApplicationStatusListener {
    private readonly analytics;
    private readonly logger;
    constructor(analytics: AnalyticsService);
    handleStatusChanged(event: ApplicationStatusChangedEvent & {
        fromStatus: string | null;
    }): Promise<void>;
}
