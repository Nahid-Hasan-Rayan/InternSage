"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AggregatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const jobs_service_1 = require("../jobs/jobs.service");
const rss_job_adapter_1 = require("./adapters/rss-job.adapter");
const scraper_job_adapter_1 = require("./adapters/scraper-job.adapter");
let AggregatorService = AggregatorService_1 = class AggregatorService {
    constructor(prisma, rssAdapter, scraperAdapter) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AggregatorService_1.name);
        this.adapters = [rssAdapter, scraperAdapter];
    }
    async runOnce() {
        const summary = {
            adaptersRun: [],
            fetched: 0,
            created: 0,
            skippedDuplicates: 0,
        };
        for (const adapter of this.adapters) {
            if (!adapter.enabled) {
                continue;
            }
            summary.adaptersRun.push(adapter.name);
            const listings = await adapter.fetchListings();
            summary.fetched += listings.length;
            for (const listing of listings) {
                const company = await this.prisma.company.upsert({
                    where: { emailDomain: listing.companyEmailDomain },
                    update: {},
                    create: {
                        name: listing.companyName,
                        emailDomain: listing.companyEmailDomain,
                        verified: false,
                    },
                });
                const dedupHash = (0, jobs_service_1.computeDedupHash)(listing.title, company.id, listing.externalUrl);
                const existing = await this.prisma.jobPosting.findUnique({ where: { dedupHash } });
                if (existing) {
                    summary.skippedDuplicates += 1;
                    continue;
                }
                await this.prisma.jobPosting.create({
                    data: {
                        companyId: company.id,
                        title: listing.title,
                        description: listing.description,
                        requirementsText: listing.requirementsText,
                        location: listing.location,
                        category: listing.category,
                        source: listing.source,
                        externalUrl: listing.externalUrl,
                        dedupHash,
                    },
                });
                summary.created += 1;
            }
        }
        this.logger.log(`Aggregation run: ${JSON.stringify(summary)}`);
        return summary;
    }
};
exports.AggregatorService = AggregatorService;
exports.AggregatorService = AggregatorService = AggregatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rss_job_adapter_1.RssJobAdapter,
        scraper_job_adapter_1.ScraperJobAdapter])
], AggregatorService);
//# sourceMappingURL=aggregator.service.js.map