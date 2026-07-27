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
exports.CvService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let CvService = class CvService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requireOwnProfileId(userId) {
        const profile = await this.prisma.professionalProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Professional profile not found for this account.');
        }
        return profile.id;
    }
    async getFullCv(userId) {
        const profileId = await this.requireOwnProfileId(userId);
        const [profile, skills, experiences, educations, projects] = await Promise.all([
            this.prisma.professionalProfile.findUniqueOrThrow({ where: { id: profileId } }),
            this.prisma.userSkill.findMany({
                where: { professionalProfileId: profileId },
                include: { skill: true },
            }),
            this.prisma.experience.findMany({
                where: { professionalProfileId: profileId },
                orderBy: { startDate: 'desc' },
            }),
            this.prisma.education.findMany({ where: { professionalProfileId: profileId } }),
            this.prisma.project.findMany({ where: { professionalProfileId: profileId } }),
        ]);
        return { profile, skills, experiences, educations, projects };
    }
    async listSkillCatalog() {
        return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
    }
    async addSkill(userId, dto) {
        const profileId = await this.requireOwnProfileId(userId);
        const normalizedName = dto.name.trim();
        const skill = await this.prisma.skill.upsert({
            where: { name: normalizedName },
            update: {},
            create: { name: normalizedName },
        });
        return this.prisma.userSkill.upsert({
            where: {
                professionalProfileId_skillId: { professionalProfileId: profileId, skillId: skill.id },
            },
            update: {},
            create: { professionalProfileId: profileId, skillId: skill.id },
            include: { skill: true },
        });
    }
    async removeSkill(userId, skillId) {
        const profileId = await this.requireOwnProfileId(userId);
        const link = await this.prisma.userSkill.findUnique({
            where: { professionalProfileId_skillId: { professionalProfileId: profileId, skillId } },
        });
        if (!link) {
            throw new common_1.NotFoundException('That skill is not on your profile.');
        }
        await this.prisma.userSkill.delete({ where: { id: link.id } });
        return { removed: true };
    }
    async addExperience(userId, dto) {
        const profileId = await this.requireOwnProfileId(userId);
        return this.prisma.experience.create({
            data: {
                professionalProfileId: profileId,
                title: dto.title,
                organization: dto.organization,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                description: dto.description,
            },
        });
    }
    async addEducation(userId, dto) {
        const profileId = await this.requireOwnProfileId(userId);
        return this.prisma.education.create({
            data: {
                professionalProfileId: profileId,
                institution: dto.institution,
                degree: dto.degree,
                startYear: dto.startYear,
                endYear: dto.endYear,
            },
        });
    }
    async addProject(userId, dto) {
        const profileId = await this.requireOwnProfileId(userId);
        return this.prisma.project.create({
            data: {
                professionalProfileId: profileId,
                title: dto.title,
                description: dto.description,
                portfolioUrl: dto.portfolioUrl,
            },
        });
    }
    async assertOwnsExperience(userId, experienceId) {
        const profileId = await this.requireOwnProfileId(userId);
        const experience = await this.prisma.experience.findUnique({ where: { id: experienceId } });
        if (!experience || experience.professionalProfileId !== profileId) {
            throw new common_1.ForbiddenException('You do not own this record.');
        }
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CvService);
//# sourceMappingURL=cv.service.js.map