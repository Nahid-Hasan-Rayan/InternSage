// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MetricsService (Prometheus)
 *
 * Wraps a single `prom-client` Registry so every metric in the
 * process is defined in exactly one place. `RequestLoggingInterceptor`
 * and `AllExceptionsFilter` both record into these — nothing else
 * should call `new client.Counter(...)` anywhere else in the app,
 * or the /metrics output silently fragments across registries.
 *
 * This is infra-level "is the service healthy" monitoring — request
 * rate, latency, error rate, in a format Prometheus/Grafana (or any
 * compatible scraper: Datadog, Grafana Cloud, etc.) can ingest
 * directly. It answers a different question than AnalyticsService,
 * which answers "what are users doing" — see docs/MONITORING.md for
 * how the two fit together.
 */

import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry: client.Registry;

  readonly httpRequestsTotal: client.Counter<string>;
  readonly httpRequestDurationSeconds: client.Histogram<string>;
  readonly httpErrorsTotal: client.Counter<string>;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry, prefix: 'internsage_' });

    this.httpRequestsTotal = new client.Counter({
      name: 'internsage_http_requests_total',
      help: 'Total HTTP requests, labelled by method, route, and status code.',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new client.Histogram({
      name: 'internsage_http_request_duration_seconds',
      help: 'HTTP request duration in seconds, labelled by method and route.',
      labelNames: ['method', 'route', 'status'],
      // Tuned for a typical CRUD API: sub-10ms cache-ish responses up
      // through multi-second worst cases (e.g. a slow AI-service call
      // in Phase 2), rather than the client's generic default buckets.
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpErrorsTotal = new client.Counter({
      name: 'internsage_http_errors_total',
      help: 'Total HTTP requests that resulted in a 4xx/5xx response, labelled by route and status.',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });
  }

  observeRequest(method: string, route: string, status: number, durationMs: number): void {
    const labels = { method, route, status: String(status) };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, durationMs / 1000);
    if (status >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  async metricsText(): Promise<string> {
    return this.registry.metrics();
  }
}
