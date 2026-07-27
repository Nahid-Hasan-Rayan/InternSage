import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { AnalyticsService } from '../../analytics/analytics.service';
import { MetricsService } from '../../metrics/metrics.service';
export interface RequestWithTelemetry extends Request {
    user?: {
        id: string;
        role: 'STUDENT' | 'RECRUITER' | 'ADMIN';
    };
    internsageStartedAt?: number;
    internsageRoute?: string;
}
export declare class RequestLoggingInterceptor implements NestInterceptor {
    private readonly metrics;
    private readonly analytics;
    private readonly logger;
    constructor(metrics: MetricsService, analytics: AnalyticsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private finish;
}
