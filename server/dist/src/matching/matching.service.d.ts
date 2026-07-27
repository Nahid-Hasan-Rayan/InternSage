import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
export declare class MatchingService {
    private readonly prisma;
    private readonly analytics;
    constructor(prisma: PrismaService, analytics: AnalyticsService);
    private loadStudentSkillSet;
    private loadWeights;
    recomputeForStudent(studentProfileId: string): Promise<{
        id: string;
        jobPostingId: string;
        studentProfileId: string;
        score: number;
        matchedSkills: import("@prisma/client/runtime/library").JsonValue;
        missingSkills: import("@prisma/client/runtime/library").JsonValue;
        computedAt: Date;
    }[]>;
    recomputeForAllStudents(): Promise<{
        studentsProcessed: number;
        matchScoresWritten: number;
    }>;
    getMatchesForStudent(studentProfileId: string, take?: number): Promise<({
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
}
