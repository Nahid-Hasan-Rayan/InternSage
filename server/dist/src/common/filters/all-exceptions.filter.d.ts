import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { AnalyticsService } from '../../analytics/analytics.service';
import { MetricsService } from '../../metrics/metrics.service';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly metrics;
    private readonly analytics;
    private readonly logger;
    constructor(metrics: MetricsService, analytics: AnalyticsService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private extractMessage;
}
