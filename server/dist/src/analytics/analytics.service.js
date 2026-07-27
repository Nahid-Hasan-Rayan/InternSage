"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async record(input) {
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
                    metadata: input.metadata,
                },
            });
        }
        catch (error) {
            this.logger.warn(`Failed to record analytics event: ${error.message}`);
        }
    }
    async recordError(input) {
        try {
            await this.prisma.errorLog.create({ data: input });
        }
        catch (error) {
            this.logger.warn(`Failed to record error log: ${error.message}`);
        }
    }
    async getSummary(days) {
        const since = this.since(days);
        const [totalRequests, totalErrors, newSignups, logins, failedLogins, activeUserRows, durationAgg,] = await Promise.all([
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
    async getTopRoutes(days, limit = 10) {
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
    async getTraffic(days) {
        const since = this.since(days);
        return this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT
        date_trunc('day', "createdAt") AS day,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "statusCode" >= 400) AS errors
      FROM "analytics_events"
      WHERE "type" = 'REQUEST' AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `).then((rows) => rows.map((row) => ({
            day: row.day,
            total: Number(row.total),
            errors: Number(row.errors),
        })));
    }
    async getTopErrors(days, limit) {
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
    async getRecentErrors(days, limit) {
        const since = this.since(days);
        return this.prisma.errorLog.findMany({
            where: { createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    since(days) {
        return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map