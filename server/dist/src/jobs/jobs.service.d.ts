import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { ListJobPostingsDto } from './dto/list-job-postings.dto';
export declare function computeDedupHash(title: string, companyId: string, externalUrl?: string | null): string;
export declare class JobsService {
    private readonly prisma;
    private readonly analytics;
    constructor(prisma: PrismaService, analytics: AnalyticsService);
    private resolveRecruiterCompanyId;
    create(userId: string, dto: CreateJobPostingDto): Promise<{
        requiredSkills: ({
            skill: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.SkillCategory;
            };
        } & {
            id: string;
            skillId: string;
            jobPostingId: string;
        })[];
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
    }>;
    findMany(dto: ListJobPostingsDto): Promise<{
        items: ({
            company: {
                id: string;
                name: string;
            };
            requiredSkills: ({
                skill: {
                    id: string;
                    name: string;
                    category: import(".prisma/client").$Enums.SkillCategory;
                };
            } & {
                id: string;
                skillId: string;
                jobPostingId: string;
            })[];
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
        })[];
        total: number;
        take: number;
        skip: number;
    }>;
    findOne(id: string): Promise<{
        company: {
            id: string;
            name: string;
        };
        requiredSkills: ({
            skill: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.SkillCategory;
            };
        } & {
            id: string;
            skillId: string;
            jobPostingId: string;
        })[];
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
    }>;
    private assertOwnership;
    update(userId: string, jobPostingId: string, dto: UpdateJobPostingDto): Promise<{
        requiredSkills: ({
            skill: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.SkillCategory;
            };
        } & {
            id: string;
            skillId: string;
            jobPostingId: string;
        })[];
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
    }>;
    deactivate(userId: string, jobPostingId: string): Promise<{
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
    }>;
}
