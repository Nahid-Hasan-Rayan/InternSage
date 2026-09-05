// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CreateEventDto
 *
 * Deliberately a narrow *subset* of AnalyticsEventType — REQUEST is
 * written only by RequestLoggingInterceptor and must never be
 * spoofable by a client, so it's excluded here. Anything a real
 * product event needs is in this enum; if a new one is needed later,
 * add it to both this enum and the Prisma AnalyticsEventType.
 */

import { IsEnum, IsObject, IsOptional } from 'class-validator';

export enum ClientEventType {
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  CV_UPDATED = 'CV_UPDATED',
}

export class CreateEventDto {
  @IsEnum(ClientEventType)
  type!: ClientEventType;

  // No shape enforced beyond "is an object" — this is deliberately
  // flexible product telemetry (e.g. { section: 'skills' }), not
  // security- or money-relevant data. Never put anything sensitive
  // (raw form values, tokens) into this field.
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
