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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const analytics_service_1 = require("./analytics.service");
const create_event_dto_1 = require("./dto/create-event.dto");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
let AnalyticsController = class AnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    async trackEvent(dto, user) {
        await this.analytics.record({
            type: dto.type,
            userId: user.id,
            userRole: user.role,
            metadata: dto.metadata,
        });
        return { accepted: true };
    }
    getSummary(query) {
        return this.analytics.getSummary(query.days);
    }
    getTopRoutes(query) {
        return this.analytics.getTopRoutes(query.days);
    }
    getTraffic(query) {
        return this.analytics.getTraffic(query.days);
    }
    getTopErrors(query) {
        return this.analytics.getTopErrors(query.days, query.limit);
    }
    getRecentErrors(query) {
        return this.analytics.getRecentErrors(query.days, query.limit);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('event'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_event_dto_1.CreateEventDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEvent", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Get)('admin/summary'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSummary", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Get)('admin/routes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTopRoutes", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Get)('admin/traffic'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTraffic", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Get)('admin/errors/top'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.ErrorLogQueryDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTopErrors", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Get)('admin/errors/recent'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.ErrorLogQueryDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getRecentErrors", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map