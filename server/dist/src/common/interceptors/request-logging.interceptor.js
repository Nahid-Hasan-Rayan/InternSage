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
exports.RequestLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const analytics_service_1 = require("../../analytics/analytics.service");
const metrics_service_1 = require("../../metrics/metrics.service");
let RequestLoggingInterceptor = class RequestLoggingInterceptor {
    constructor(metrics, analytics) {
        this.metrics = metrics;
        this.analytics = analytics;
        this.logger = new common_1.Logger('HTTP');
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const start = Date.now();
        const routePath = req.route?.path ?? req.path;
        req.internsageStartedAt = start;
        req.internsageRoute = routePath;
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => this.finish(req, res, routePath, start),
        }));
    }
    finish(req, res, routePath, start) {
        const durationMs = Date.now() - start;
        const statusCode = res.statusCode;
        const method = req.method;
        if (routePath === '/metrics') {
            return;
        }
        this.metrics.observeRequest(method, routePath, statusCode, durationMs);
        void this.analytics.record({
            type: 'REQUEST',
            userId: req.user?.id,
            userRole: req.user?.role,
            path: routePath,
            method,
            statusCode,
            durationMs,
        });
        if (statusCode >= 500) {
            this.logger.error(`${method} ${routePath} ${statusCode} ${durationMs}ms`);
        }
        else if (statusCode >= 400) {
            this.logger.warn(`${method} ${routePath} ${statusCode} ${durationMs}ms`);
        }
        else {
            this.logger.log(`${method} ${routePath} ${statusCode} ${durationMs}ms`);
        }
    }
};
exports.RequestLoggingInterceptor = RequestLoggingInterceptor;
exports.RequestLoggingInterceptor = RequestLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService,
        analytics_service_1.AnalyticsService])
], RequestLoggingInterceptor);
//# sourceMappingURL=request-logging.interceptor.js.map