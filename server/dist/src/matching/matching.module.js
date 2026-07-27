"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingModule = void 0;
const common_1 = require("@nestjs/common");
const matching_controller_1 = require("./matching.controller");
const matching_service_1 = require("./matching.service");
const analytics_module_1 = require("../analytics/analytics.module");
let MatchingModule = class MatchingModule {
};
exports.MatchingModule = MatchingModule;
exports.MatchingModule = MatchingModule = __decorate([
    (0, common_1.Module)({
        imports: [analytics_module_1.AnalyticsModule],
        controllers: [matching_controller_1.MatchingController],
        providers: [matching_service_1.MatchingService],
        exports: [matching_service_1.MatchingService],
    })
], MatchingModule);
//# sourceMappingURL=matching.module.js.map