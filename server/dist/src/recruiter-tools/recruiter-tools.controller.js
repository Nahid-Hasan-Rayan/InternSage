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
exports.RecruiterToolsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const recruiter_tools_service_1 = require("./recruiter-tools.service");
const recruiter_tools_dto_1 = require("./dto/recruiter-tools.dto");
let RecruiterToolsController = class RecruiterToolsController {
    constructor(recruiterToolsService) {
        this.recruiterToolsService = recruiterToolsService;
    }
    getWeights(user) {
        return this.recruiterToolsService.getMyWeights(user.id);
    }
    updateWeights(user, dto) {
        return this.recruiterToolsService.upsertMyWeights(user.id, dto);
    }
    createKit(user, dto) {
        return this.recruiterToolsService.createInterviewKit(user.id, dto);
    }
    listKits(user) {
        return this.recruiterToolsService.listMyInterviewKits(user.id);
    }
    submitScorecard(user, applicationId, dto) {
        return this.recruiterToolsService.submitScorecard(user.id, applicationId, dto);
    }
    listScorecards(user, applicationId) {
        return this.recruiterToolsService.listScorecardsForApplication(user.id, applicationId);
    }
};
exports.RecruiterToolsController = RecruiterToolsController;
__decorate([
    (0, common_1.Get)('weights'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecruiterToolsController.prototype, "getWeights", null);
__decorate([
    (0, common_1.Put)('weights'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, recruiter_tools_dto_1.UpdateRecruiterWeightsDto]),
    __metadata("design:returntype", void 0)
], RecruiterToolsController.prototype, "updateWeights", null);
__decorate([
    (0, common_1.Post)('interview-kits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, recruiter_tools_dto_1.CreateInterviewKitDto]),
    __metadata("design:returntype", void 0)
], RecruiterToolsController.prototype, "createKit", null);
__decorate([
    (0, common_1.Get)('interview-kits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecruiterToolsController.prototype, "listKits", null);
__decorate([
    (0, common_1.Post)('applications/:applicationId/scorecards'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, recruiter_tools_dto_1.SubmitScorecardDto]),
    __metadata("design:returntype", void 0)
], RecruiterToolsController.prototype, "submitScorecard", null);
__decorate([
    (0, common_1.Get)('applications/:applicationId/scorecards'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('applicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecruiterToolsController.prototype, "listScorecards", null);
exports.RecruiterToolsController = RecruiterToolsController = __decorate([
    (0, common_1.Controller)('recruiter-tools'),
    (0, roles_decorator_1.Roles)(client_1.Role.RECRUITER),
    __metadata("design:paramtypes", [recruiter_tools_service_1.RecruiterToolsService])
], RecruiterToolsController);
//# sourceMappingURL=recruiter-tools.controller.js.map