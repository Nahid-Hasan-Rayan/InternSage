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
exports.RecruiterToolsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const DEFAULT_WEIGHTS = {
    skillsWeight: 0.4,
    projectsWeight: 0.2,
    authenticityWeight: 0.3,
    softSkillsWeight: 0.1,
};
let RecruiterToolsService = class RecruiterToolsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveCompanyId(userId) {
        const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
        if (!recruiterProfile) {
            throw new common_1.ForbiddenException('Only recruiters can access recruiter tooling.');
        }
        return recruiterProfile.companyId;
    }
    async getMyWeights(userId) {
        const companyId = await this.resolveCompanyId(userId);
        const weights = await this.prisma.recruiterWeights.findUnique({ where: { companyId } });
        return weights ?? { companyId, ...DEFAULT_WEIGHTS };
    }
    async upsertMyWeights(userId, dto) {
        const companyId = await this.resolveCompanyId(userId);
        return this.prisma.recruiterWeights.upsert({
            where: { companyId },
            update: { ...dto },
            create: { companyId, ...dto },
        });
    }
    async createInterviewKit(userId, dto) {
        const companyId = await this.resolveCompanyId(userId);
        const existing = await this.prisma.interviewKit.findUnique({
            where: { companyId_roleTitle: { companyId, roleTitle: dto.roleTitle } },
        });
        if (existing) {
            throw new common_1.ConflictException('An interview kit for this role already exists for your company.');
        }
        return this.prisma.interviewKit.create({
            data: { companyId, roleTitle: dto.roleTitle, criteria: dto.criteria },
        });
    }
    async listMyInterviewKits(userId) {
        const companyId = await this.resolveCompanyId(userId);
        return this.prisma.interviewKit.findMany({ where: { companyId }, orderBy: { roleTitle: 'asc' } });
    }
    async assertApplicationOwnership(userId, applicationId) {
        const companyId = await this.resolveCompanyId(userId);
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: { jobPosting: true },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found.');
        }
        if (application.jobPosting.companyId !== companyId) {
            throw new common_1.ForbiddenException('This application does not belong to your company.');
        }
        return { application, companyId };
    }
    async submitScorecard(userId, applicationId, dto) {
        const { companyId } = await this.assertApplicationOwnership(userId, applicationId);
        const kit = await this.prisma.interviewKit.findUnique({ where: { id: dto.interviewKitId } });
        if (!kit || kit.companyId !== companyId) {
            throw new common_1.ForbiddenException('This interview kit does not belong to your company.');
        }
        return this.prisma.scorecard.create({
            data: {
                applicationId,
                interviewKitId: dto.interviewKitId,
                submittedById: userId,
                ratings: dto.ratings,
                notes: dto.notes,
                recommendation: dto.recommendation,
            },
        });
    }
    async listScorecardsForApplication(userId, applicationId) {
        await this.assertApplicationOwnership(userId, applicationId);
        return this.prisma.scorecard.findMany({
            where: { applicationId },
            include: { interviewKit: { select: { roleTitle: true, criteria: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.RecruiterToolsService = RecruiterToolsService;
exports.RecruiterToolsService = RecruiterToolsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecruiterToolsService);
//# sourceMappingURL=recruiter-tools.service.js.map