/**
 * InternSage — RequestLoggingInterceptor
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-INTERCEPTOR-001
 * File   : src/common/interceptors/request-logging.interceptor.ts
 *
 * Registered globally (APP_INTERCEPTOR in app.module.ts) so every
 * request — auth'd or not, successful or not — is measured exactly
 * once, in exactly one place, rather than each controller having to
 * remember to instrument itself.
 *
 * Writes to two different systems on purpose, because they answer
 * different questions and have different audiences/retention needs
 * (see docs/MONITORING.md):
 *   - MetricsService (Prometheus, in-memory, cheap, scraped) — "is
 *     the service healthy right now / over the last N minutes."
 *   - AnalyticsService (Postgres, durable, queried on-demand) — "what
 *     happened, historically, that a person will want to look up."
 *
 * Both writes are fire-and-forget from this interceptor's point of
 * view — a telemetry failure must never turn into a 500 for the
 * actual request. AnalyticsService.record() already swallows its own
 * errors; this interceptor doesn't await it, so even a slow DB write
 * can't add latency to the response the caller is waiting on.
 *
 * `/metrics` itself is excluded from analytics recording — otherwise
 * every Prometheus scrape (every ~15s, forever) would pollute the
 * events table with a row that has zero product value.
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AnalyticsService } from '../../analytics/analytics.service';
import { MetricsService } from '../../metrics/metrics.service';

export interface RequestWithTelemetry extends Request {
  user?: { id: string; role: 'STUDENT' | 'RECRUITER' | 'ADMIN' };
  // Stamped here, read by AllExceptionsFilter — the filter is the one
  // that knows the *final* status code for an errored request (see
  // that file's header comment for why this interceptor deliberately
  // does NOT record anything on the error path itself).
  internsageStartedAt?: number;
  internsageRoute?: string;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    private readonly metrics: MetricsService,
    private readonly analytics: AnalyticsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTelemetry>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    // Route *pattern* (e.g. "/api/profile/:id"), not the raw URL with
    // real IDs/query strings in it — grouping by pattern is what
    // makes "top routes" and per-minute rate metrics meaningful
    // instead of one row per unique URL forever.
    const routePath = (req.route?.path as string | undefined) ?? req.path;
    req.internsageStartedAt = start;
    req.internsageRoute = routePath;

    return next.handle().pipe(
      tap({
        // Only the success path is recorded here. If the handler
        // throws, res.statusCode is NOT yet finalized at this point
        // in Nest's pipeline (the exception filter sets it *after*
        // this interceptor's error branch would run) — recording here
        // would silently mislabel every error as whatever status
        // happened to be on the response object at that moment.
        // AllExceptionsFilter records the error path instead, once
        // the real status is known.
        next: () => this.finish(req, res, routePath, start),
      }),
    );
  }

  private finish(req: RequestWithTelemetry, res: Response, routePath: string, start: number): void {
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
    } else if (statusCode >= 400) {
      this.logger.warn(`${method} ${routePath} ${statusCode} ${durationMs}ms`);
    } else {
      this.logger.log(`${method} ${routePath} ${statusCode} ${durationMs}ms`);
    }
  }
}
