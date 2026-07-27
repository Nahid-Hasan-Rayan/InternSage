/**
 * InternSage — Application DTOs
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-APPLICATIONS-DTO-001
 * File   : src/applications/dto/application.dto.ts
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
