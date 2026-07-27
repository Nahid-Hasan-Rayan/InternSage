import * as client from 'prom-client';
export declare class MetricsService {
    readonly registry: client.Registry;
    readonly httpRequestsTotal: client.Counter<string>;
    readonly httpRequestDurationSeconds: client.Histogram<string>;
    readonly httpErrorsTotal: client.Counter<string>;
    constructor();
    observeRequest(method: string, route: string, status: number, durationMs: number): void;
    metricsText(): Promise<string>;
}
