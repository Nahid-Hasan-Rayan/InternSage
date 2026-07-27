import { AggregatorService } from './aggregator.service';
export declare class AggregatorController {
    private readonly aggregatorService;
    constructor(aggregatorService: AggregatorService);
    runOnce(): Promise<import("./aggregator.service").AggregationSummary>;
}
