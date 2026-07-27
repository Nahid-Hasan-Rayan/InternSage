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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
const analytics_service_1 = require("../analytics/analytics.service");
const QUESTIONS_PER_SESSION = 5;
const SESSION_DURATION_MS = 10 * 60 * 1000;
const PASS_THRESHOLD = 70;
const DECAY_AMOUNT = 5;
const DECAY_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
let VerificationService = class VerificationService {
    constructor(prisma, analytics) {
        this.prisma = prisma;
        this.analytics = analytics;
    }
    async loadOwnedUserSkill(userId, userSkillId) {
        const userSkill = await this.prisma.userSkill.findUnique({
            where: { id: userSkillId },
            include: { professionalProfile: { select: { userId: true } }, skill: true },
        });
        if (!userSkill) {
            throw new common_1.NotFoundException('Claimed skill not found.');
        }
        if (userSkill.professionalProfile.userId !== userId) {
            throw new common_1.ForbiddenException('You can only verify your own claimed skills.');
        }
        return userSkill;
    }
    async startSession(userId, dto) {
        const userSkill = await this.loadOwnedUserSkill(userId, dto.userSkillId);
        const activeSession = await this.prisma.verificationSession.findFirst({
            where: { userSkillId: userSkill.id, status: client_1.VerificationStatus.IN_PROGRESS, expiresAt: { gt: new Date() } },
        });
        if (activeSession) {
            throw new common_1.ConflictException('A verification session for this skill is already in progress.');
        }
        const bank = await this.prisma.verificationQuestion.findMany({ where: { skillId: userSkill.skillId } });
        if (bank.length === 0) {
            throw new common_1.NotFoundException('No verification questions exist yet for this skill.');
        }
        const chosen = shuffle(bank).slice(0, Math.min(QUESTIONS_PER_SESSION, bank.length));
        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + SESSION_DURATION_MS);
        const session = await this.prisma.verificationSession.create({
            data: {
                userSkillId: userSkill.id,
                questionIds: chosen.map((q) => q.id),
                answers: [],
                status: client_1.VerificationStatus.IN_PROGRESS,
                startedAt,
                expiresAt,
            },
        });
        return {
            sessionId: session.id,
            expiresAt: session.expiresAt,
            questions: chosen.map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices })),
        };
    }
    async submitSession(userId, sessionId, dto) {
        const session = await this.prisma.verificationSession.findUnique({
            where: { id: sessionId },
            include: { userSkill: { include: { professionalProfile: { select: { userId: true } } } } },
        });
        if (!session) {
            throw new common_1.NotFoundException('Verification session not found.');
        }
        if (session.userSkill.professionalProfile.userId !== userId) {
            throw new common_1.ForbiddenException('You can only submit your own verification session.');
        }
        if (session.status !== client_1.VerificationStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('This session has already been completed.');
        }
        if (new Date() > session.expiresAt) {
            await this.prisma.verificationSession.update({
                where: { id: session.id },
                data: { status: client_1.VerificationStatus.EXPIRED },
            });
            throw new common_1.BadRequestException('This verification session has expired.');
        }
        if (dto.answers.length !== session.questionIds.length) {
            throw new common_1.BadRequestException(`Expected ${session.questionIds.length} answers, received ${dto.answers.length}.`);
        }
        const questions = await this.prisma.verificationQuestion.findMany({
            where: { id: { in: session.questionIds } },
        });
        const questionById = new Map(questions.map((q) => [q.id, q]));
        let correctAnswers = 0;
        session.questionIds.forEach((questionId, index) => {
            const question = questionById.get(questionId);
            if (question && question.correctIndex === dto.answers[index]) {
                correctAnswers += 1;
            }
        });
        const score = Math.round((correctAnswers / session.questionIds.length) * 100);
        const verified = score >= PASS_THRESHOLD;
        const completedAt = new Date();
        await this.prisma.$transaction([
            this.prisma.verificationSession.update({
                where: { id: session.id },
                data: { answers: dto.answers, score, status: client_1.VerificationStatus.COMPLETED, completedAt },
            }),
            this.prisma.userSkill.update({
                where: { id: session.userSkillId },
                data: { verified, authenticityScore: score, authenticityUpdatedAt: completedAt },
            }),
        ]);
        void this.analytics.record({
            type: 'VERIFICATION_COMPLETED',
            userId,
            metadata: { userSkillId: session.userSkillId, score, verified },
        });
        return { score, verified, correctAnswers, totalQuestions: session.questionIds.length };
    }
    async decayAllScores() {
        const cutoff = new Date(Date.now() - DECAY_INTERVAL_MS);
        const candidates = await this.prisma.userSkill.findMany({
            where: { authenticityScore: { not: null }, authenticityUpdatedAt: { lt: cutoff } },
        });
        for (const candidate of candidates) {
            const newScore = Math.max(0, (candidate.authenticityScore ?? 0) - DECAY_AMOUNT);
            await this.prisma.userSkill.update({
                where: { id: candidate.id },
                data: {
                    authenticityScore: newScore,
                    authenticityUpdatedAt: new Date(),
                    verified: newScore >= PASS_THRESHOLD,
                },
            });
        }
        return { processed: candidates.length };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        analytics_service_1.AnalyticsService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map