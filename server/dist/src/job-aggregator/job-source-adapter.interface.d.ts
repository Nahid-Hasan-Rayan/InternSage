import { JobSource, SkillCategory } from '@prisma/client';
export interface RawListing {
    title: string;
    description: string;
    requirementsText: string;
    companyName: string;
    companyEmailDomain: string;
    location?: string;
    category?: SkillCategory;
    externalUrl: string;
    source: JobSource;
}
export interface JobSourceAdapter {
    readonly name: string;
    readonly enabled: boolean;
    fetchListings(): Promise<RawListing[]>;
}
