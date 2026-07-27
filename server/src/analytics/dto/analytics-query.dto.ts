/**
 * InternSage — Analytics query DTO
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-ANALYTICS-DTO-001
 * File   : src/analytics/dto/analytics-query.dto.ts
 */

import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyticsQueryDto {
  // Bounded 1-90 days deliberately — an unbounded range query
  // against an append-only events table is exactly the kind of
  // "innocent-looking" endpoint that eventually takes the database
  // down as the table grows. Widen only alongside adding real
  // pagination/aggregation limits, not by just raising this number.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  @IsOptional()
  days: number = 7;
}

export class ErrorLogQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  @IsOptional()
  days: number = 7;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 50;
}
