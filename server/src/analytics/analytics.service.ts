/**
 * InternSage — AnalyticsService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-ANALYTICS-SVC-001
 * File   : src/analytics/analytics.service.ts
 *
 * Two responsibilities, deliberately kept in one service because
 * they share the same table:
 *   1. Writing — `record()` / `recordError()`. Always fire-and-forget
 *      from the caller's point of view (see RequestLoggingInterceptor
 *      and AllExceptionsFilter): a write failure here must NEVER
 *      surface as a failure of the real request, so every write is
 *      wrapped in try/catch with a logged warning, nothing thrown.
 *   2. Reading — the `get*` methods, called only from
 *      AnalyticsController, which is ADMIN-only. This is internal
 *      product telemetry, not a per-user feature — a student or
 *      recruiter has no route that reaches this service's read side.
 *
 * `days` on every read method is bounded by AnalyticsQueryDto
 * (1-90) before it ever reaches here.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventType, Prisma, Role } from '@prisma/client';
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

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget by design — never let telemetry break a real request. */
  async record(input: RecordEventInput): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          type: input.type,
          userId: input.userId,
          userRole: input.userRole,
          path: input.path,
          method: input.method,
          statusCode: input.statusCode,
          durationMs: input.durationMs,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to record analytics event: ${(error as Error).message}`);
    }
  }

  /** Fire-and-forget by design — same reasoning as record() above. */
  async recordError(input: RecordErrorInput): Promise<void> {
    try {
      await this.prisma.errorLog.create({ data: input });
    } catch (error) {
      this.logger.warn(`Failed to record error log: ${(error as Error).message}`);
    }
  }

  async getSummary(days: number) {
    const since = this.since(days);

    const [
      totalRequests,
      totalErrors,
      newSignups,
      logins,
      failedLogins,
      activeUserRows,
      durationAgg,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { type: 'REQUEST', createdAt: { gte: since } } }),
      this.prisma.errorLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.analyticsEvent.count({ where: { type: 'AUTH_REGISTER', createdAt: { gte: since } } }),
      this.prisma.analyticsEvent.count({ where: { type: 'AUTH_LOGIN', createdAt: { gte: since } } }),
      this.prisma.analyticsEvent.count({ where: { type: 'AUTH_LOGIN_FAILED', createdAt: { gte: since } } }),
      this.prisma.analyticsEvent.findMany({
        where: { type: 'REQUEST', createdAt: { gte: since }, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.analyticsEvent.aggregate({
        where: { type: 'REQUEST', createdAt: { gte: since }, durationMs: { not: null } },
        _avg: { durationMs: true },
      }),
    ]);

    return {
      windowDays: days,
      totalRequests,
      totalErrors,
      errorRatePct: totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0,
      newSignups,
      logins,
      failedLogins,
      activeUsers: activeUserRows.length,
      avgResponseMs: durationAgg._avg.durationMs ? Math.round(durationAgg._avg.durationMs) : null,
    };
  }

  async getTopRoutes(days: number, limit = 10) {
    const since = this.since(days);
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['path', 'method'],
      where: { type: 'REQUEST', createdAt: { gte: since }, path: { not: null } },
      _count: { _all: true },
      _avg: { durationMs: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });

    return grouped.map((row) => ({
      path: row.path,
      method: row.method,
      requests: row._count._all,
      avgResponseMs: row._avg.durationMs ? Math.round(row._avg.durationMs) : null,
    }));
  }

  async getTraffic(days: number) {
    const since = this.since(days);
    // Daily bucketing needs date_trunc — Prisma's groupBy has no
    // date-truncation primitive, so this is deliberately raw SQL
    // rather than pulling every row into Node to bucket by hand.
    return this.prisma.$queryRaw<
      Array<{ day: Date; total: bigint; errors: bigint }>
    >(Prisma.sql`
      SELECT
        date_trunc('day', "createdAt") AS day,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "statusCode" >= 400) AS errors
      FROM "analytics_events"
      WHERE "type" = 'REQUEST' AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `).then((rows) =>
      rows.map((row) => ({
        day: row.day,
        total: Number(row.total),
        errors: Number(row.errors),
      })),
    );
  }

  async getTopErrors(days: number, limit: number) {
    const since = this.since(days);
    const grouped = await this.prisma.errorLog.groupBy({
      by: ['message', 'path', 'statusCode'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { message: 'desc' } },
      take: limit,
    });

    return grouped.map((row) => ({
      message: row.message,
      path: row.path,
      statusCode: row.statusCode,
      occurrences: row._count._all,
    }));
  }

  async getRecentErrors(days: number, limit: number) {
    const since = this.since(days);
    return this.prisma.errorLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private since(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
}
