import { SkillCategory } from '@prisma/client';
export declare class CreateJobPostingDto {
    title: string;
    description: string;
    requirementsText: string;
    location?: string;
    category?: SkillCategory;
    externalUrl?: string;
    requiredSkillIds: string[];
}
