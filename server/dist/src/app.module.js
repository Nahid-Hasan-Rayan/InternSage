"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_module_1 = require("./common/prisma/prisma.module");
const audit_module_1 = require("./common/audit/audit.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./auth/auth.module");
const profile_module_1 = require("./profile/profile.module");
const cv_module_1 = require("./cv/cv.module");
const health_module_1 = require("./health/health.module");
const metrics_module_1 = require("./metrics/metrics.module");
const analytics_module_1 = require("./analytics/analytics.module");
const jobs_module_1 = require("./jobs/jobs.module");
const job_aggregator_module_1 = require("./job-aggregator/job-aggregator.module");
const matching_module_1 = require("./matching/matching.module");
const verification_module_1 = require("./verification/verification.module");
const applications_module_1 = require("./applications/applications.module");
const recruiter_tools_module_1 = require("./recruiter-tools/recruiter-tools.module");
const copilot_module_1 = require("./copilot/copilot.module");
const messaging_module_1 = require("./messaging/messaging.module");
const request_logging_interceptor_1 = require("./common/interceptors/request-logging.interceptor");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const env_validation_1 = require("./config/env.validation");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, validate: env_validation_1.validateEnv }),
            event_emitter_1.EventEmitterModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 20,
                },
            ]),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            metrics_module_1.MetricsModule,
            analytics_module_1.AnalyticsModule,
            auth_module_1.AuthModule,
            profile_module_1.ProfileModule,
            cv_module_1.CvModule,
            health_module_1.HealthModule,
            jobs_module_1.JobsModule,
            job_aggregator_module_1.JobAggregatorModule,
            matching_module_1.MatchingModule,
            verification_module_1.VerificationModule,
            applications_module_1.ApplicationsModule,
            recruiter_tools_module_1.RecruiterToolsModule,
            copilot_module_1.CopilotModule,
            messaging_module_1.MessagingModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: request_logging_interceptor_1.RequestLoggingInterceptor },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map