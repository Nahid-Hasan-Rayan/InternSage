import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { ListJobPostingsDto } from './dto/list-job-postings.dto';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    findMany(query: ListJobPostingsDto): Promise<{
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
    create(user: AuthenticatedUser, dto: CreateJobPostingDto): Promise<{
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
    update(user: AuthenticatedUser, id: string, dto: UpdateJobPostingDto): Promise<{
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
    deactivate(user: AuthenticatedUser, id: string): Promise<{
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
