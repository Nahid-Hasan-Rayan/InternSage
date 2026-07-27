import { AnalyticsEventType, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
export interface RecordEventInput {
    type: AnalyticsEventType;
    userId?: string;
    userRole?: Role;
    path?: string;
    method?: string;
    statusCode?: number;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}
export interface RecordErrorInput {
    message: string;
    stack?: string;
    path?: string;
    method?: string;
    statusCode: number;
    requestId: string;
    userId?: string;
}
export declare class AnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    record(input: RecordEventInput): Promise<void>;
    recordError(input: RecordErrorInput): Promise<void>;
    getSummary(days: number): Promise<{
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
    getTopRoutes(days: number, limit?: number): Promise<{
        path: string | null;
        method: string | null;
        requests: number;
        avgResponseMs: number | null;
    }[]>;
    getTraffic(days: number): Promise<{
        day: Date;
        total: number;
        errors: number;
    }[]>;
    getTopErrors(days: number, limit: number): Promise<{
        message: string;
        path: string | null;
        statusCode: number;
        occurrences: number;
    }[]>;
    getRecentErrors(days: number, limit: number): Promise<{
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
    private since;
}
