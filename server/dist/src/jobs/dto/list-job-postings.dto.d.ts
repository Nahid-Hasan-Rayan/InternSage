import { SkillCategory } from '@prisma/client';
export declare class ListJobPostingsDto {
    category?: SkillCategory;
    location?: string;
    keyword?: string;
    take: number;
    skip: number;
}
