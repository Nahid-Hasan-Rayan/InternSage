/**
 * InternSage — Environment variable schema
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-CONFIG-001
 * File   : src/config/env.validation.ts
 *
 * Wired into ConfigModule.forRoot({ validate }) in app.module.ts.
 * Nest runs this *before* the application context finishes
 * bootstrapping — a missing or malformed env var fails the
 * process immediately, with a specific field-level error message,
 * instead of surfacing later as a confusing runtime crash the
 * first time that variable is actually read.
 */

import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  // `enableImplicitConversion` alone does NOT reliably coerce
  // `process.env` string values into numbers here — confirmed by
  // direct reproduction: a string "3000" stayed typeof 'string' and
  // failed @IsInt/@Min/@Max simultaneously. @Type(() => Number) is
  // the explicit, dependable mechanism; don't remove it.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  // Supabase's direct (non-pooled) connection string, used only by
  // `prisma migrate` — see prisma/schema.prisma's datasource block
  // for why this is separate from DATABASE_URL. Optional because
  // local dev against docker-compose Postgres doesn't need pooling
  // at all and can reuse the same URL for both.
  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  // Deliberately long minimum — see the reasoning in main.ts's
  // history: a short JWT secret is brute-forceable, and this is
  // the single credential that would let an attacker forge a
  // session for any user in the system.
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters — generate one with `openssl rand -base64 48`.' })
  JWT_SECRET!: string;

  // Backs the cast in auth.module.ts — validated here, once, so
  // that cast is a documented guarantee instead of a blind assertion.
  // Covers the common short-form durations (e.g. "1d", "12h", "30m");
  // deliberately not the full `ms` package grammar (which also
  // accepts things like "2.5 days" or "-3h") — narrower on purpose,
  // since an env var should be set to one predictable, greppable format.
  @IsString()
  @Matches(/^\d+(ms|s|m|h|d|w|y)$/, {
    message: 'JWT_EXPIRES_IN must look like "30m", "12h", "1d", or "7d" — a number followed by a single unit.',
  })
  @IsOptional()
  JWT_EXPIRES_IN = '1d';

  @IsString()
  @MinLength(1, { message: 'CORS_ORIGINS must list at least one allowed origin — never leave this empty.' })
  CORS_ORIGINS!: string;

  // Gates GET /api/metrics — see MetricsController and
  // docs/MONITORING.md. Optional locally, strongly recommended
  // wherever the API is reachable from the public internet.
  @IsString()
  @IsOptional()
  METRICS_TOKEN?: string;

  // Job aggregator's one configured legitimate source (see
  // job-aggregator/adapters/rss-job.adapter.ts). All optional —
  // with none set, the RSS adapter is disabled (safe default).
  // Comma-separated RSS feed URLs for AggregatorService's
  // RssJobAdapter. Empty/unset = adapter disabled (safe default).
  @IsString()
  @IsOptional()
  JOB_RSS_FEED_URLS?: string;

  // Must be the literal string "true" to enable — see
  // ScraperJobAdapter's header comment on why this stays off by
  // default even when set to anything else.
  @IsString()
  @IsOptional()
  JOB_SCRAPER_ENABLED?: string;

  // Shared secret Vercel Cron sends as "Authorization: Bearer
  // <value>" — see CronSecretGuard. Required for the internal
  // aggregate/recompute/decay endpoints to work at all (fail-closed
  // if unset).
  @IsString()
  @IsOptional()
  CRON_SECRET?: string;

  // Sage Copilot's NLU (see copilot/intent-parser/openrouter-intent-parser.ts).
  // Unset = falls back to RuleBasedIntentParser automatically —
  // Copilot works with zero budget, just with narrower recognition.
  @IsString()
  @IsOptional()
  OPENROUTER_API_KEY?: string;

  // Defaults to a free-tier model in code if unset. OpenRouter
  // rotates which models carry the ":free" suffix — check
  // https://openrouter.ai/models?max_price=0 if Copilot starts
  // silently falling back and update this, no redeploy of code
  // logic needed.
  @IsString()
  @IsOptional()
  OPENROUTER_MODEL?: string;

  // Sent as OpenRouter's HTTP-Referer header — cosmetic (helps
  // OpenRouter attribute free-tier usage), never required.
  @IsString()
  @IsOptional()
  PUBLIC_APP_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const summary = errors
      .map((err) => Object.values(err.constraints ?? {}).join('; '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${summary}`);
  }

  return validated;
}
