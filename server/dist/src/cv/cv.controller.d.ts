import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CvService } from './cv.service';
import { AddEducationDto, AddExperienceDto, AddProjectDto, AddSkillDto } from './dto/cv.dto';
export declare class CvController {
    private readonly cvService;
    constructor(cvService: CvService);
    getFullCv(user: AuthenticatedUser): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            headline: string | null;
            visibility: import(".prisma/client").$Enums.ProfileVisibility;
        };
        skills: ({
            skill: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.SkillCategory;
            };
        } & {
            id: string;
            verified: boolean;
            createdAt: Date;
            skillId: string;
            professionalProfileId: string;
            authenticityScore: number | null;
            authenticityUpdatedAt: Date | null;
        })[];
        experiences: {
            id: string;
            title: string;
            description: string | null;
            organization: string;
            startDate: Date;
            endDate: Date | null;
            professionalProfileId: string;
        }[];
        educations: {
            id: string;
            verified: boolean;
            institution: string;
            degree: string;
            startYear: number;
            endYear: number | null;
            professionalProfileId: string;
        }[];
        projects: {
            id: string;
            title: string;
            description: string | null;
            portfolioUrl: string | null;
            professionalProfileId: string;
        }[];
    }>;
    listSkillCatalog(): Promise<{
        id: string;
        name: string;
        category: import(".prisma/client").$Enums.SkillCategory;
    }[]>;
    addSkill(user: AuthenticatedUser, dto: AddSkillDto): Promise<{
        skill: {
            id: string;
            name: string;
            category: import(".prisma/client").$Enums.SkillCategory;
        };
    } & {
        id: string;
        verified: boolean;
        createdAt: Date;
        skillId: string;
        professionalProfileId: string;
        authenticityScore: number | null;
        authenticityUpdatedAt: Date | null;
    }>;
    removeSkill(user: AuthenticatedUser, skillId: string): Promise<{
        removed: boolean;
    }>;
    addExperience(user: AuthenticatedUser, dto: AddExperienceDto): Promise<{
        id: string;
        title: string;
        description: string | null;
        organization: string;
        startDate: Date;
        endDate: Date | null;
        professionalProfileId: string;
    }>;
    addEducation(user: AuthenticatedUser, dto: AddEducationDto): Promise<{
        id: string;
        verified: boolean;
        institution: string;
        degree: string;
        startYear: number;
        endYear: number | null;
        professionalProfileId: string;
    }>;
    addProject(user: AuthenticatedUser, dto: AddProjectDto): Promise<{
        id: string;
        title: string;
        description: string | null;
        portfolioUrl: string | null;
        professionalProfileId: string;
    }>;
}
