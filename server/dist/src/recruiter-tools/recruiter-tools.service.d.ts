import { PrismaService } from '../common/prisma/prisma.service';
import { CreateInterviewKitDto, SubmitScorecardDto, UpdateRecruiterWeightsDto } from './dto/recruiter-tools.dto';
export declare class RecruiterToolsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private resolveCompanyId;
    getMyWeights(userId: string): Promise<{
        id: string;
        companyId: string;
        skillsWeight: number;
        projectsWeight: number;
        authenticityWeight: number;
        softSkillsWeight: number;
    } | {
        skillsWeight: number;
        projectsWeight: number;
        authenticityWeight: number;
        softSkillsWeight: number;
        companyId: string;
    }>;
    upsertMyWeights(userId: string, dto: UpdateRecruiterWeightsDto): Promise<{
        id: string;
        companyId: string;
        skillsWeight: number;
        projectsWeight: number;
        authenticityWeight: number;
        softSkillsWeight: number;
    }>;
    createInterviewKit(userId: string, dto: CreateInterviewKitDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        roleTitle: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }>;
    listMyInterviewKits(userId: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        roleTitle: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    private assertApplicationOwnership;
    submitScorecard(userId: string, applicationId: string, dto: SubmitScorecardDto): Promise<{
        id: string;
        createdAt: Date;
        applicationId: string;
        interviewKitId: string;
        ratings: import("@prisma/client/runtime/library").JsonValue;
        notes: string | null;
        recommendation: import(".prisma/client").$Enums.ScorecardRecommendation;
        submittedById: string;
    }>;
    listScorecardsForApplication(userId: string, applicationId: string): Promise<({
        interviewKit: {
            roleTitle: string;
            criteria: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        createdAt: Date;
        applicationId: string;
        interviewKitId: string;
        ratings: import("@prisma/client/runtime/library").JsonValue;
        notes: string | null;
        recommendation: import(".prisma/client").$Enums.ScorecardRecommendation;
        submittedById: string;
    })[]>;
}
