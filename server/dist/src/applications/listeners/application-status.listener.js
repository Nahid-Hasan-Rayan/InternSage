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
var ApplicationStatusListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatusListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const analytics_service_1 = require("../../analytics/analytics.service");
let ApplicationStatusListener = ApplicationStatusListener_1 = class ApplicationStatusListener {
    constructor(analytics) {
        this.analytics = analytics;
        this.logger = new common_1.Logger(ApplicationStatusListener_1.name);
    }
    async handleStatusChanged(event) {
        this.logger.log(`Application ${event.applicationId} for user ${event.applicantUserId}: ` +
            `${event.fromStatus ?? '(new)'} -> ${event.toStatus}`);
        void this.analytics.record({
            type: 'REQUEST',
            userId: event.applicantUserId,
            metadata: {
                kind: 'application_status_changed',
                applicationId: event.applicationId,
                fromStatus: event.fromStatus,
                toStatus: event.toStatus,
            },
        });
    }
};
exports.ApplicationStatusListener = ApplicationStatusListener;
__decorate([
    (0, event_emitter_1.OnEvent)('application.statusChanged'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApplicationStatusListener.prototype, "handleStatusChanged", null);
exports.ApplicationStatusListener = ApplicationStatusListener = ApplicationStatusListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], ApplicationStatusListener);
//# sourceMappingURL=application-status.listener.js.map