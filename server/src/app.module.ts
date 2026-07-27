/**
 * InternSage — Root application module
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-APP-001
 * File   : src/app.module.ts
 *
 * Two guards are registered globally, in this order:
 *   1. ThrottlerGuard  — rate limits every request before auth
 *      even runs, so brute-forcing /auth/login is throttled the
 *      same as any other endpoint.
 *   2. JwtAuthGuard     — requires a valid token unless the route
 *      is @Public().
 *   3. RolesGuard       — narrows access further where @Roles()
 *      is present.
 * Nest applies APP_GUARD providers in registration order, so this
 * order is deliberate, not incidental.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { CvModule } from './cv/cv.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JobsModule } from './jobs/jobs.module';
import { JobAggregatorModule } from './job-aggregator/job-aggregator.module';
import { MatchingModule } from './matching/matching.module';
import { VerificationModule } from './verification/verification.module';
import { ApplicationsModule } from './applications/applications.module';
import { RecruiterToolsModule } from './recruiter-tools/recruiter-tools.module';
import { CopilotModule } from './copilot/copilot.module';
import { MessagingModule } from './messaging/messaging.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Called exactly once, here — see ApplicationsModule's header
    // comment for why feature modules don't call forRoot() again.
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        // 20 requests per 60 seconds per IP by default. Tighten
        // further per-route with @Throttle() where a specific
        // endpoint (e.g. login) warrants stricter limits.
        ttl: 60_000,
        limit: 20,
      },
    ]),
    PrismaModule,
    AuditModule,
    MetricsModule,
    AnalyticsModule,
    AuthModule,
    ProfileModule,
    CvModule,
    HealthModule,
    JobsModule,
    JobAggregatorModule,
    MatchingModule,
    VerificationModule,
    ApplicationsModule,
    RecruiterToolsModule,
    CopilotModule,
    MessagingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Interceptor before filter in registration order: every request
    // (success or failure) is timestamped by the interceptor first;
    // the filter reads that timestamp back out on the error path.
    // See RequestLoggingInterceptor's header comment for the full
    // reasoning on why success/error telemetry is split across the
    // two rather than both living in one place.
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
