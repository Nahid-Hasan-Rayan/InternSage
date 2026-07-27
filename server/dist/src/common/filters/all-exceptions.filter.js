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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const analytics_service_1 = require("../../analytics/analytics.service");
const metrics_service_1 = require("../../metrics/metrics.service");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(metrics, analytics) {
        this.metrics = metrics;
        this.analytics = analytics;
        this.logger = new common_1.Logger('Exception');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const requestId = (0, crypto_1.randomUUID)();
        const isHttpException = exception instanceof common_1.HttpException;
        const statusCode = isHttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const rawMessage = this.extractMessage(exception);
        const clientMessage = isHttpException ? rawMessage : 'Something went wrong. Please try again.';
        const stack = exception instanceof Error ? exception.stack : undefined;
        const routePath = req.internsageRoute ?? req.path;
        const durationMs = req.internsageStartedAt ? Date.now() - req.internsageStartedAt : 0;
        this.logger.error(`[${requestId}] ${req.method} ${routePath} ${statusCode} — ${rawMessage}`, stack);
        this.metrics.observeRequest(req.method, routePath, statusCode, durationMs);
        void this.analytics.record({
            type: 'REQUEST',
            userId: req.user?.id,
            userRole: req.user?.role,
            path: routePath,
            method: req.method,
            statusCode,
            durationMs,
        });
        if (statusCode >= 500) {
            void this.analytics.recordError({
                message: rawMessage,
                stack,
                path: routePath,
                method: req.method,
                statusCode,
                requestId,
                userId: req.user?.id,
            });
        }
        res.setHeader('x-request-id', requestId);
        res.status(statusCode).json({
            statusCode,
            message: clientMessage,
            requestId,
            timestamp: new Date().toISOString(),
            path: routePath,
        });
    }
    extractMessage(exception) {
        if (exception instanceof common_1.HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'string')
                return response;
            if (typeof response === 'object' && response !== null && 'message' in response) {
                const msg = response.message;
                return Array.isArray(msg) ? msg.join(', ') : String(msg);
            }
            return exception.message;
        }
        if (exception instanceof Error) {
            return exception.message;
        }
        return 'Unknown error';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService,
        analytics_service_1.AnalyticsService])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map