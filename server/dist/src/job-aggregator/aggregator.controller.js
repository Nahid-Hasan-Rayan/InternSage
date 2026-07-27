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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatorController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../common/decorators/public.decorator");
const cron_secret_guard_1 = require("../common/guards/cron-secret.guard");
const aggregator_service_1 = require("./aggregator.service");
let AggregatorController = class AggregatorController {
    constructor(aggregatorService) {
        this.aggregatorService = aggregatorService;
    }
    runOnce() {
        return this.aggregatorService.runOnce();
    }
};
exports.AggregatorController = AggregatorController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(cron_secret_guard_1.CronSecretGuard),
    (0, common_1.Get)('aggregate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AggregatorController.prototype, "runOnce", null);
exports.AggregatorController = AggregatorController = __decorate([
    (0, common_1.Controller)('internal/jobs'),
    __metadata("design:paramtypes", [aggregator_service_1.AggregatorService])
], AggregatorController);
//# sourceMappingURL=aggregator.controller.js.map