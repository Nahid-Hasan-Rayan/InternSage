export declare class AddSkillDto {
    name: string;
}
export declare class AddExperienceDto {
    title: string;
    organization: string;
    startDate: string;
    endDate?: string;
    description?: string;
}
export declare class AddEducationDto {
    institution: string;
    degree: string;
    startYear: number;
    endYear?: number;
}
export declare class AddProjectDto {
    title: string;
    description?: string;
    portfolioUrl?: string;
}
