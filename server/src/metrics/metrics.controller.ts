// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MetricsController
 *
 * Exposes Prometheus text-format metrics at GET /api/metrics.
 * Deliberately @Public() — a Prometheus scraper has no user JWT —
 * but gated by a separate shared-secret header (METRICS_TOKEN) when
 * that env var is set, since this endpoint should never be reachable
 * from the open internet in production. Recommended deployment: keep
 * METRICS_TOKEN set AND restrict the route at the network/ingress
 * level (internal-only) — the token is defence in depth, not the
 * only control.
 */

import { Controller, Get, Header, Res, UnauthorizedException, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain')
  async scrape(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<string> {
    const requiredToken = process.env.METRICS_TOKEN;
    if (requiredToken) {
      const provided = req.header('x-metrics-token');
      if (provided !== requiredToken) {
        throw new UnauthorizedException('Missing or invalid metrics token.');
      }
    }
    res.setHeader('Content-Type', this.metrics.registry.contentType);
    return this.metrics.metricsText();
  }
}
