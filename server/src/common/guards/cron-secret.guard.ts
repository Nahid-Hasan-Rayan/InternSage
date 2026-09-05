// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CronSecretGuard
 *
 * Vercel Cron Jobs (see vercel.json's "crons" array) call an
 * endpoint on a schedule with no end-user session — there is no JWT
 * to check, so these routes are marked @Public() to skip
 * JwtAuthGuard, and THIS guard is what actually protects them.
 *
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
 * on requests it triggers, once CRON_SECRET is set as an env var on
 * the project — this guard just verifies that header matches. If
 * CRON_SECRET isn't configured at all, every request is rejected
 * (fail closed) rather than silently allowing unauthenticated calls
 * to internal batch endpoints (job aggregation, match recompute).
 *
 * Locally, call these endpoints yourself with the same header:
 *   curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/internal/jobs/aggregate
 */

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const configured = process.env.CRON_SECRET;

    if (!configured) {
      throw new UnauthorizedException('CRON_SECRET is not configured on this deployment.');
    }

    const header = req.header('authorization');
    const provided = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

    if (provided !== configured) {
      throw new UnauthorizedException('Invalid or missing cron secret.');
    }

    return true;
  }
}
