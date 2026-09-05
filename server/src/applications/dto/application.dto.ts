// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Application DTOs
 *
 */

import { IsEnum } from 'class-validator';

export enum ClientApplicationStatus {
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export class UpdateApplicationStatusDto {
  @IsEnum(ClientApplicationStatus)
  status!: ClientApplicationStatus;
}
