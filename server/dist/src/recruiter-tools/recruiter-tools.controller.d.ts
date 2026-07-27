import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RecruiterToolsService } from './recruiter-tools.service';
import { UpdateRecruiterWeightsDto, CreateInterviewKitDto, SubmitScorecardDto } from './dto/recruiter-tools.dto';
export declare class RecruiterToolsController {
    private readonly recruiterToolsService;
    constructor(recruiterToolsService: RecruiterToolsService);
    getWeights(user: AuthenticatedUser): Promise<{
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
    updateWeights(user: AuthenticatedUser, dto: UpdateRecruiterWeightsDto): Promise<{
        id: string;
        companyId: string;
        skillsWeight: number;
        projectsWeight: number;
        authenticityWeight: number;
        softSkillsWeight: number;
    }>;
    createKit(user: AuthenticatedUser, dto: CreateInterviewKitDto): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        roleTitle: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }>;
    listKits(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        roleTitle: string;
        criteria: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    submitScorecard(user: AuthenticatedUser, applicationId: string, dto: SubmitScorecardDto): Promise<{
        id: string;
        createdAt: Date;
        applicationId: string;
        interviewKitId: string;
        ratings: import("@prisma/client/runtime/library").JsonValue;
        notes: string | null;
        recommendation: import(".prisma/client").$Enums.ScorecardRecommendation;
        submittedById: string;
    }>;
    listScorecards(user: AuthenticatedUser, applicationId: string): Promise<({
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
