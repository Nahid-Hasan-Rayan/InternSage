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
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const COLD_MESSAGE_TRUST_THRESHOLD = 50;
let MessagingService = class MessagingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loadApplicationWithParties(applicationId) {
        const application = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: { jobPosting: { include: { company: true } } },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found.');
        }
        return application;
    }
    async resolveParty(userId, application) {
        if (application.userId === userId) {
            return { kind: 'STUDENT' };
        }
        const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
        if (recruiterProfile && recruiterProfile.companyId === application.jobPosting.companyId) {
            return { kind: 'RECRUITER', companyId: recruiterProfile.companyId };
        }
        throw new common_1.ForbiddenException('You are not a party to this application\'s conversation.');
    }
    async getOrCreateConversation(applicationId) {
        const existing = await this.prisma.conversation.findUnique({ where: { applicationId } });
        if (existing) {
            return existing;
        }
        return this.prisma.conversation.create({ data: { applicationId } });
    }
    async sendMessage(userId, applicationId, body) {
        const application = await this.loadApplicationWithParties(applicationId);
        const party = await this.resolveParty(userId, application);
        const conversation = await this.getOrCreateConversation(applicationId);
        if (party.kind === 'RECRUITER') {
            const messageCount = await this.prisma.message.count({ where: { conversationId: conversation.id } });
            const isFirstMessage = messageCount === 0;
            if (isFirstMessage && application.jobPosting.company.trustScore < COLD_MESSAGE_TRUST_THRESHOLD) {
                throw new common_1.ForbiddenException('Your company\'s trust score is currently too low to message a student first.');
            }
        }
        return this.prisma.message.create({
            data: { conversationId: conversation.id, senderUserId: userId, body },
        });
    }
    async listMessages(userId, applicationId) {
        const application = await this.loadApplicationWithParties(applicationId);
        await this.resolveParty(userId, application);
        const conversation = await this.prisma.conversation.findUnique({ where: { applicationId } });
        if (!conversation) {
            return [];
        }
        return this.prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map