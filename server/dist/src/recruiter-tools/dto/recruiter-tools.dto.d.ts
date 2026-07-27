import { ScorecardRecommendation } from '@prisma/client';
export declare class UpdateRecruiterWeightsDto {
    skillsWeight: number;
    projectsWeight: number;
    authenticityWeight: number;
    softSkillsWeight: number;
}
declare class CriterionDto {
    label: string;
    description?: string;
}
export declare class CreateInterviewKitDto {
    roleTitle: string;
    criteria: CriterionDto[];
}
export declare class SubmitScorecardDto {
    interviewKitId: string;
    ratings: Record<string, number>;
    notes?: string;
    recommendation: ScorecardRecommendation;
}
export {};
