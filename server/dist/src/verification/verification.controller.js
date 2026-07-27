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
exports.VerificationController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const cron_secret_guard_1 = require("../common/guards/cron-secret.guard");
const verification_service_1 = require("./verification.service");
const start_verification_dto_1 = require("./dto/start-verification.dto");
const submit_verification_dto_1 = require("./dto/submit-verification.dto");
let VerificationController = class VerificationController {
    constructor(verificationService) {
        this.verificationService = verificationService;
    }
    start(user, dto) {
        return this.verificationService.startSession(user.id, dto);
    }
    submit(user, sessionId, dto) {
        return this.verificationService.submitSession(user.id, sessionId, dto);
    }
    decay() {
        return this.verificationService.decayAllScores();
    }
};
exports.VerificationController = VerificationController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.STUDENT),
    (0, common_1.Post)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_verification_dto_1.StartVerificationDto]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "start", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.STUDENT),
    (0, common_1.Post)('sessions/:sessionId/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_verification_dto_1.SubmitVerificationDto]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "submit", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(cron_secret_guard_1.CronSecretGuard),
    (0, common_1.Get)('internal/decay'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "decay", null);
exports.VerificationController = VerificationController = __decorate([
    (0, common_1.Controller)('verification'),
    __metadata("design:paramtypes", [verification_service_1.VerificationService])
], VerificationController);
//# sourceMappingURL=verification.controller.js.map