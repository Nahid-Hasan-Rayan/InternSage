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
exports.JobsService = void 0;
exports.computeDedupHash = computeDedupHash;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../common/prisma/prisma.service");
const analytics_service_1 = require("../analytics/analytics.service");
function computeDedupHash(title, companyId, externalUrl) {
    const normalized = `${title.trim().toLowerCase()}::${companyId}::${(externalUrl ?? '').trim().toLowerCase()}`;
    return (0, crypto_1.createHash)('sha256').update(normalized).digest('hex');
}
let JobsService = class JobsService {
    constructor(prisma, analytics) {
        this.prisma = prisma;
        this.analytics = analytics;
    }
    async resolveRecruiterCompanyId(userId) {
        const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
        if (!recruiterProfile) {
            throw new common_1.ForbiddenException('Only recruiters can manage job postings.');
        }
        return recruiterProfile.companyId;
    }
    async create(userId, dto) {
        const companyId = await this.resolveRecruiterCompanyId(userId);
        const dedupHash = computeDedupHash(dto.title, companyId, dto.externalUrl);
        const existing = await this.prisma.jobPosting.findUnique({ where: { dedupHash } });
        if (existing) {
            throw new common_1.ConflictException('An identical job posting already exists for your company.');
        }
        const posting = await this.prisma.jobPosting.create({
            data: {
                companyId,
                title: dto.title,
                description: dto.description,
                requirementsText: dto.requirementsText,
                location: dto.location,
                category: dto.category,
                externalUrl: dto.externalUrl,
                dedupHash,
                requiredSkills: {
                    create: dto.requiredSkillIds.map((skillId) => ({ skillId })),
                },
            },
            include: { requiredSkills: { include: { skill: true } } },
        });
        void this.analytics.record({
            type: 'JOB_POSTING_CREATED',
            userId,
            metadata: { jobPostingId: posting.id },
        });
        return posting;
    }
    async findMany(dto) {
        const where = { isActive: true };
        if (dto.category) {
            where.category = dto.category;
        }
        if (dto.location) {
            where.location = { contains: dto.location, mode: 'insensitive' };
        }
        if (dto.keyword) {
            where.OR = [
                { title: { contains: dto.keyword, mode: 'insensitive' } },
                { description: { contains: dto.keyword, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.jobPosting.findMany({
                where,
                take: dto.take,
                skip: dto.skip,
                orderBy: { postedAt: 'desc' },
                include: { company: { select: { id: true, name: true } }, requiredSkills: { include: { skill: true } } },
            }),
            this.prisma.jobPosting.count({ where }),
        ]);
        return { items, total, take: dto.take, skip: dto.skip };
    }
    async findOne(id) {
        const posting = await this.prisma.jobPosting.findUnique({
            where: { id },
            include: { company: { select: { id: true, name: true } }, requiredSkills: { include: { skill: true } } },
        });
        if (!posting) {
            throw new common_1.NotFoundException('Job posting not found.');
        }
        return posting;
    }
    async assertOwnership(userId, jobPostingId) {
        const companyId = await this.resolveRecruiterCompanyId(userId);
        const posting = await this.prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
        if (!posting) {
            throw new common_1.NotFoundException('Job posting not found.');
        }
        if (posting.companyId !== companyId) {
            throw new common_1.ForbiddenException('You can only manage job postings that belong to your own company.');
        }
        return posting;
    }
    async update(userId, jobPostingId, dto) {
        await this.assertOwnership(userId, jobPostingId);
        const { requiredSkillIds, ...rest } = dto;
        return this.prisma.jobPosting.update({
            where: { id: jobPostingId },
            data: {
                ...rest,
                ...(requiredSkillIds
                    ? {
                        requiredSkills: {
                            deleteMany: {},
                            create: requiredSkillIds.map((skillId) => ({ skillId })),
                        },
                    }
                    : {}),
            },
            include: { requiredSkills: { include: { skill: true } } },
        });
    }
    async deactivate(userId, jobPostingId) {
        await this.assertOwnership(userId, jobPostingId);
        return this.prisma.jobPosting.update({
            where: { id: jobPostingId },
            data: { isActive: false },
        });
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        analytics_service_1.AnalyticsService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map