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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
const application_dto_1 = require("./dto/application.dto");
const TERMINAL_STATUSES = [client_1.ApplicationStatus.REJECTED, client_1.ApplicationStatus.WITHDRAWN];
let ApplicationsService = class ApplicationsService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async apply(userId, jobPostingId) {
        const jobPosting = await this.prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
        if (!jobPosting) {
            throw new common_1.NotFoundException('That job posting no longer exists.');
        }
        try {
            const application = await this.prisma.application.create({
                data: { userId, jobPostingId },
            });
            this.events.emit('application.statusChanged', {
                applicationId: application.id,
                applicantUserId: userId,
                fromStatus: null,
                toStatus: application.status,
            });
            return application;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException("You've already applied to this posting.");
            }
            throw error;
        }
    }
    async listMine(userId) {
        return this.prisma.application.findMany({
            where: { userId },
            include: { jobPosting: { include: { company: { select: { name: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listForRecruiter(userId) {
        const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
        if (!recruiterProfile) {
            throw new common_1.NotFoundException('No recruiter profile found for this account.');
        }
        return this.prisma.application.findMany({
            where: { jobPosting: { companyId: recruiterProfile.companyId } },
            include: { jobPosting: { select: { title: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(actingUserId, actingRole, applicationId, requested) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: { jobPosting: true },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found.');
        }
        if (TERMINAL_STATUSES.includes(application.status)) {
            throw new common_1.BadRequestException(`This application is already ${application.status.toLowerCase()} and cannot be changed further.`);
        }
        if (actingRole === client_1.Role.STUDENT) {
            if (application.userId !== actingUserId) {
                throw new common_1.ForbiddenException('This is not your application.');
            }
            if (requested !== application_dto_1.ClientApplicationStatus.WITHDRAWN) {
                throw new common_1.ForbiddenException('Students may only withdraw an application, not set its outcome.');
            }
        }
        else if (actingRole === client_1.Role.RECRUITER) {
            const recruiterProfile = await this.prisma.recruiterProfile.findUnique({
                where: { userId: actingUserId },
            });
            if (!recruiterProfile || recruiterProfile.companyId !== application.jobPosting.companyId) {
                throw new common_1.ForbiddenException('This application does not belong to your company.');
            }
            if (requested === application_dto_1.ClientApplicationStatus.WITHDRAWN) {
                throw new common_1.ForbiddenException('Only the candidate can withdraw their own application.');
            }
        }
        else {
            throw new common_1.ForbiddenException('Not permitted to update application status.');
        }
        const fromStatus = application.status;
        const updated = await this.prisma.application.update({
            where: { id: applicationId },
            data: { status: requested },
        });
        this.events.emit('application.statusChanged', {
            applicationId: updated.id,
            applicantUserId: updated.userId,
            fromStatus,
            toStatus: updated.status,
        });
        return updated;
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map