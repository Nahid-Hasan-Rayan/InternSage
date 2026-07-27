import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';
import { AnalyticsQueryDto, ErrorLogQueryDto } from './dto/analytics-query.dto';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    trackEvent(dto: CreateEventDto, user: AuthenticatedUser): Promise<{
        accepted: boolean;
    }>;
    getSummary(query: AnalyticsQueryDto): Promise<{
        windowDays: number;
        totalRequests: number;
        totalErrors: number;
        errorRatePct: number;
        newSignups: number;
        logins: number;
        failedLogins: number;
        activeUsers: number;
        avgResponseMs: number | null;
    }>;
    getTopRoutes(query: AnalyticsQueryDto): Promise<{
        path: string | null;
        method: string | null;
        requests: number;
        avgResponseMs: number | null;
    }[]>;
    getTraffic(query: AnalyticsQueryDto): Promise<{
        day: Date;
        total: number;
        errors: number;
    }[]>;
    getTopErrors(query: ErrorLogQueryDto): Promise<{
        message: string;
        path: string | null;
        statusCode: number;
        occurrences: number;
    }[]>;
    getRecentErrors(query: ErrorLogQueryDto): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        userId: string | null;
        path: string | null;
        method: string | null;
        statusCode: number;
        stack: string | null;
        requestId: string;
    }[]>;
}
