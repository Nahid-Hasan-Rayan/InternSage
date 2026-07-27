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
exports.MatchingController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const cron_secret_guard_1 = require("../common/guards/cron-secret.guard");
const prisma_service_1 = require("../common/prisma/prisma.service");
const matching_service_1 = require("./matching.service");
let MatchingController = class MatchingController {
    constructor(matchingService, prisma) {
        this.matchingService = matchingService;
        this.prisma = prisma;
    }
    async resolveOwnStudentProfileId(userId) {
        const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
        if (!profile) {
            throw new common_1.ForbiddenException('Only students have match scores.');
        }
        return profile.id;
    }
    async getMyMatches(user) {
        const studentProfileId = await this.resolveOwnStudentProfileId(user.id);
        return this.matchingService.getMatchesForStudent(studentProfileId);
    }
    async recomputeMine(user) {
        const studentProfileId = await this.resolveOwnStudentProfileId(user.id);
        return this.matchingService.recomputeForStudent(studentProfileId);
    }
    recomputeAll() {
        return this.matchingService.recomputeForAllStudents();
    }
};
exports.MatchingController = MatchingController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.STUDENT),
    (0, common_1.Get)('matches'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "getMyMatches", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.STUDENT),
    (0, common_1.Post)('matches/recompute'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "recomputeMine", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(cron_secret_guard_1.CronSecretGuard),
    (0, common_1.Get)('internal/matching/recompute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MatchingController.prototype, "recomputeAll", null);
exports.MatchingController = MatchingController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [matching_service_1.MatchingService,
        prisma_service_1.PrismaService])
], MatchingController);
//# sourceMappingURL=matching.controller.js.map