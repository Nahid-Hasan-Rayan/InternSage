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
exports.CopilotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../common/audit/audit.service");
const protected_characteristic_guard_1 = require("./protected-characteristic.guard");
const copilot_constants_1 = require("./copilot.constants");
let CopilotService = class CopilotService {
    constructor(prisma, audit, intentParser) {
        this.prisma = prisma;
        this.audit = audit;
        this.intentParser = intentParser;
    }
    async resolveCompanyId(userId) {
        const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
        if (!recruiterProfile) {
            throw new common_1.ForbiddenException('Only recruiters can use Sage Copilot.');
        }
        return recruiterProfile.companyId;
    }
    async query(userId, question) {
        const companyId = await this.resolveCompanyId(userId);
        if ((0, protected_characteristic_guard_1.containsProtectedCharacteristic)(question)) {
            await this.audit.log({
                actorId: userId,
                action: 'COPILOT_QUERY_BLOCKED',
                targetType: 'Company',
                targetId: companyId,
                metadata: { question },
            });
            return { blocked: true, appliedFilters: {}, results: [] };
        }
        const skills = await this.prisma.skill.findMany({ select: { name: true } });
        const knownSkillNames = skills.map((s) => s.name);
        const intent = await this.intentParser.parse(question, knownSkillNames);
        const applications = await this.prisma.application.findMany({
            where: { jobPosting: { companyId } },
            select: { userId: true },
            distinct: ['userId'],
        });
        let candidateUserIds = applications.map((a) => a.userId);
        if (candidateUserIds.length === 0) {
            await this.logQuery(userId, companyId, question, intent, 0);
            return { blocked: false, appliedFilters: intent, results: [] };
        }
        const studentWhere = { userId: { in: candidateUserIds } };
        if (intent.major) {
            studentWhere.major = { contains: intent.major, mode: 'insensitive' };
        }
        if (intent.year) {
            studentWhere.year = intent.year;
        }
        if (intent.universityName) {
            studentWhere.university = { name: { contains: intent.universityName, mode: 'insensitive' } };
        }
        const students = await this.prisma.studentProfile.findMany({
            where: studentWhere,
            include: { university: { select: { name: true } } },
        });
        candidateUserIds = students.map((s) => s.userId);
        if ((intent.skillNames && intent.skillNames.length > 0) || intent.minAuthenticity) {
            const someClause = {};
            if (intent.skillNames && intent.skillNames.length > 0) {
                someClause.skill = { name: { in: intent.skillNames } };
            }
            if (intent.minAuthenticity) {
                someClause.authenticityScore = { gte: intent.minAuthenticity };
            }
            const matches = await this.prisma.professionalProfile.findMany({
                where: { userId: { in: candidateUserIds }, skills: { some: someClause } },
                select: { userId: true },
            });
            const allowed = new Set(matches.map((m) => m.userId));
            candidateUserIds = candidateUserIds.filter((id) => allowed.has(id));
        }
        const finalResults = students
            .filter((s) => candidateUserIds.includes(s.userId))
            .map((s) => ({ userId: s.userId, major: s.major, year: s.year, universityName: s.university?.name }));
        await this.logQuery(userId, companyId, question, intent, finalResults.length);
        return { blocked: false, appliedFilters: intent, results: finalResults };
    }
    async logQuery(userId, companyId, question, appliedFilters, resultCount) {
        await this.audit.log({
            actorId: userId,
            action: 'COPILOT_QUERY',
            targetType: 'Company',
            targetId: companyId,
            metadata: { question, appliedFilters, resultCount },
        });
    }
};
exports.CopilotService = CopilotService;
exports.CopilotService = CopilotService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(copilot_constants_1.COPILOT_INTENT_PARSER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService, Object])
], CopilotService);
//# sourceMappingURL=copilot.service.js.map