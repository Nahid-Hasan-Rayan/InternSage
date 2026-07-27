"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RssJobAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RssJobAdapter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function extractTag(block, tag) {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
}
let RssJobAdapter = RssJobAdapter_1 = class RssJobAdapter {
    constructor() {
        this.name = 'rss';
        this.logger = new common_1.Logger(RssJobAdapter_1.name);
    }
    get enabled() {
        return this.feedUrls.length > 0;
    }
    get feedUrls() {
        return (process.env.JOB_RSS_FEED_URLS ?? '')
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean);
    }
    async fetchListings() {
        if (!this.enabled) {
            return [];
        }
        const results = [];
        for (const feedUrl of this.feedUrls) {
            try {
                const response = await fetch(feedUrl);
                if (!response.ok) {
                    this.logger.warn(`Feed ${feedUrl} responded with ${response.status}`);
                    continue;
                }
                const xml = await response.text();
                const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? [];
                for (const item of items) {
                    const title = extractTag(item, 'title');
                    const link = extractTag(item, 'link');
                    const description = extractTag(item, 'description');
                    if (!title || !link) {
                        continue;
                    }
                    results.push({
                        title,
                        description: description || title,
                        requirementsText: description || title,
                        companyName: new URL(feedUrl).hostname,
                        companyEmailDomain: new URL(feedUrl).hostname,
                        externalUrl: link,
                        source: client_1.JobSource.RSS,
                    });
                }
            }
            catch (error) {
                this.logger.warn(`Failed to fetch/parse feed ${feedUrl}: ${error.message}`);
            }
        }
        return results;
    }
};
exports.RssJobAdapter = RssJobAdapter;
exports.RssJobAdapter = RssJobAdapter = RssJobAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], RssJobAdapter);
//# sourceMappingURL=rss-job.adapter.js.map