/**
 * InternSage — AllExceptionsFilter
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-FILTER-001
 * File   : src/common/filters/all-exceptions.filter.ts
 *
 * Registered globally (APP_FILTER in app.module.ts), catching
 * everything — both NestJS HttpExceptions (validation errors, 401s,
 * 403s, ...) and genuine unhandled exceptions (a bug, a DB timeout).
 *
 * Three things happen for every error, in this order:
 *   1. A `requestId` (crypto.randomUUID) is generated and returned in
 *      both the response body and an `x-request-id` header — this is
 *      the join key a person actually greps by when a user reports
 *      "something broke": ask for the request ID, find the exact
 *      ErrorLog row and matching request logs.
 *   2. The FULL error (message, stack, path) is logged server-side
 *      and written to ErrorLog. The stack trace NEVER goes in the
 *      HTTP response — that's an information-disclosure risk (leaks
 *      file paths, internals) independent of whether the person
 *      asking is trustworthy.
 *   3. A SANITIZED message goes to the client: an HttpException's own
 *      message (these are already written to be user-facing —
 *      "Invalid email or password.", validation messages, etc.) or,
 *      for anything that isn't an HttpException (a genuine bug), a
 *      generic "Something went wrong" — the real message and stack
 *      are exactly what an attacker profiling this API would want,
 *      and a raw driver/ORM error can also leak schema details.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { AnalyticsService } from '../../analytics/analytics.service';
import { MetricsService } from '../../metrics/metrics.service';
import type { RequestWithTelemetry } from '../interceptors/request-logging.interceptor';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  constructor(
    private readonly metrics: MetricsService,
    private readonly analytics: AnalyticsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithTelemetry>();

    const requestId = randomUUID();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = this.extractMessage(exception);
    const clientMessage = isHttpException ? rawMessage : 'Something went wrong. Please try again.';
    const stack = exception instanceof Error ? exception.stack : undefined;

    const routePath = req.internsageRoute ?? req.path;
    const durationMs = req.internsageStartedAt ? Date.now() - req.internsageStartedAt : 0;

    // Server-side: full detail, always. This is what an engineer
    // actually debugs from — never trimmed for "log noise" reasons.
    this.logger.error(
      `[${requestId}] ${req.method} ${routePath} ${statusCode} — ${rawMessage}`,
      stack,
    );

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

    // 4xx (bad input, auth failures, not-found) is expected traffic,
    // not a system fault — only 5xx goes in the error triage table.
    // A high 4xx rate is still visible via Prometheus/getSummary()'s
    // errorRatePct, just not mixed into "things an engineer should
    // triage."
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

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as { message: unknown }).message;
        return Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
      return exception.message;
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Unknown error';
  }
}
