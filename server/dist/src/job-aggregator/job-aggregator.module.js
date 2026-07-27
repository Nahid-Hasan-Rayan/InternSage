"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobAggregatorModule = void 0;
const common_1 = require("@nestjs/common");
const aggregator_controller_1 = require("./aggregator.controller");
const aggregator_service_1 = require("./aggregator.service");
const rss_job_adapter_1 = require("./adapters/rss-job.adapter");
const scraper_job_adapter_1 = require("./adapters/scraper-job.adapter");
let JobAggregatorModule = class JobAggregatorModule {
};
exports.JobAggregatorModule = JobAggregatorModule;
exports.JobAggregatorModule = JobAggregatorModule = __decorate([
    (0, common_1.Module)({
        controllers: [aggregator_controller_1.AggregatorController],
        providers: [aggregator_service_1.AggregatorService, rss_job_adapter_1.RssJobAdapter, scraper_job_adapter_1.ScraperJobAdapter],
    })
], JobAggregatorModule);
//# sourceMappingURL=job-aggregator.module.js.map