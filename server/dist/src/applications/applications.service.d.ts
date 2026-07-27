import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplicationStatus, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ClientApplicationStatus } from './dto/application.dto';
export interface ApplicationStatusChangedEvent {
    applicationId: string;
    applicantUserId: string;
    fromStatus: ApplicationStatus;
    toStatus: ApplicationStatus;
}
export declare class ApplicationsService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventEmitter2);
    apply(userId: string, jobPostingId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        jobPostingId: string;
    }>;
    listMine(userId: string): Promise<({
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
    listForRecruiter(userId: string): Promise<({
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
    updateStatus(actingUserId: string, actingRole: Role, applicationId: string, requested: ClientApplicationStatus): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        jobPostingId: string;
    }>;
}
