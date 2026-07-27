import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { MatchingService } from './matching.service';
export declare class MatchingController {
    private readonly matchingService;
    private readonly prisma;
    constructor(matchingService: MatchingService, prisma: PrismaService);
    private resolveOwnStudentProfileId;
    getMyMatches(user: AuthenticatedUser): Promise<({
        jobPosting: {
            company: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            category: import(".prisma/client").$Enums.SkillCategory | null;
            dedupHash: string;
            title: string;
            description: string;
            requirementsText: string;
            location: string | null;
            source: import(".prisma/client").$Enums.JobSource;
            externalUrl: string | null;
            isActive: boolean;
            postedAt: Date;
        };
    } & {
        id: string;
        jobPostingId: string;
        studentProfileId: string;
        score: number;
        matchedSkills: import("@prisma/client/runtime/library").JsonValue;
        missingSkills: import("@prisma/client/runtime/library").JsonValue;
        computedAt: Date;
    })[]>;
    recomputeMine(user: AuthenticatedUser): Promise<{
        id: string;
        jobPostingId: string;
        studentProfileId: string;
        score: number;
        matchedSkills: import("@prisma/client/runtime/library").JsonValue;
        missingSkills: import("@prisma/client/runtime/library").JsonValue;
        computedAt: Date;
    }[]>;
    recomputeAll(): Promise<{
        studentsProcessed: number;
        matchScoresWritten: number;
    }>;
}
