// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — JobSourceAdapter interface
 *
 * Every adapter returns the same normalized shape regardless of
 * where the listing actually came from — AggregatorService never
 * needs to know or care which adapter produced a given RawListing.
 */
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
