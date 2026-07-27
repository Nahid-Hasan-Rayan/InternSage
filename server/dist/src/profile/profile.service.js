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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let ProfileService = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAcademicProfile(userId) {
        const profile = await this.prisma.studentProfile.findUnique({
            where: { userId },
            include: { university: { select: { id: true, name: true, verified: true } } },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Academic profile not found for this account.');
        }
        return profile;
    }
    async updateAcademicProfile(userId, dto) {
        await this.getAcademicProfile(userId);
        return this.prisma.studentProfile.update({
            where: { userId },
            data: dto,
        });
    }
    async getProfessionalProfile(userId) {
        const profile = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Professional profile not found for this account.');
        }
        return profile;
    }
    async updateProfessionalProfile(userId, dto) {
        await this.getProfessionalProfile(userId);
        return this.prisma.professionalProfile.update({
            where: { userId },
            data: dto,
        });
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map