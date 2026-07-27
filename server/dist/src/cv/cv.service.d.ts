import { PrismaService } from '../common/prisma/prisma.service';
import { AddEducationDto, AddExperienceDto, AddProjectDto, AddSkillDto } from './dto/cv.dto';
export declare class CvService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private requireOwnProfileId;
    getFullCv(userId: string): Promise<{
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
    addSkill(userId: string, dto: AddSkillDto): Promise<{
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
    removeSkill(userId: string, skillId: string): Promise<{
        removed: boolean;
    }>;
    addExperience(userId: string, dto: AddExperienceDto): Promise<{
        id: string;
        title: string;
        description: string | null;
        organization: string;
        startDate: Date;
        endDate: Date | null;
        professionalProfileId: string;
    }>;
    addEducation(userId: string, dto: AddEducationDto): Promise<{
        id: string;
        verified: boolean;
        institution: string;
        degree: string;
        startYear: number;
        endYear: number | null;
        professionalProfileId: string;
    }>;
    addProject(userId: string, dto: AddProjectDto): Promise<{
        id: string;
        title: string;
        description: string | null;
        portfolioUrl: string | null;
        professionalProfileId: string;
    }>;
    assertOwnsExperience(userId: string, experienceId: string): Promise<void>;
}
