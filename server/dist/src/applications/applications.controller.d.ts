import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationStatusDto } from './dto/application.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    apply(user: AuthenticatedUser, jobPostingId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        jobPostingId: string;
    }>;
    listMine(user: AuthenticatedUser): Promise<({
        jobPosting: {
            company: {
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
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        jobPostingId: string;
    })[]>;
    listForRecruiter(user: AuthenticatedUser): Promise<({
        jobPosting: {
            title: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        jobPostingId: string;
    })[]>;
    updateStatus(user: AuthenticatedUser, applicationId: string, dto: UpdateApplicationStatusDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        jobPostingId: string;
    }>;
}
