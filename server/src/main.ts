/**
 * ============================================================
 *  InternSage backend — application entry point
 * ------------------------------------------------------------
 *  Author : Nahid Hasan Rayan
 *  Marker : NHR-BE-MAIN-001
 *  File   : src/main.ts
 *
 *  Security posture applied here, deliberately, before the app
 *  accepts a single request:
 *   1. Startup env validation lives in one place —
 *      src/config/env.validation.ts, wired into ConfigModule in
 *      app.module.ts — so there's a single authoritative schema
 *      instead of scattered ad-hoc checks. If a required var is
 *      missing or malformed, NestFactory.create() below throws
 *      before any HTTP listener opens.
 *   2. Helmet sets sane HTTP security headers by default.
 *   3. CORS is an explicit allowlist from env, never "*".
 *   4. A global ValidationPipe strips unknown fields and rejects
 *      requests that don't match a DTO's shape — this is the
 *      first line of defence against malformed/malicious input,
 *      before any handler code runs.
 * ============================================================
 */

import 'reflect-metadata';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * Builds and configures the Nest application WITHOUT calling
 * `.listen()` — shared by both entry points:
 *   - this file's own `bootstrap()`, for local dev / a traditional
 *     long-running server (Docker, Railway, Render, a VPS, ...),
 *     which calls `.listen(port)` itself below.
 *   - `api/index.ts`, the Vercel serverless entrypoint, which needs
 *     the configured Express instance WITHOUT a listening socket —
 *     Vercel's runtime owns the socket, not this code.
 * Keeping this factory in one place means the security wiring
 * (helmet, CORS, ValidationPipe) can never drift between "how it
 * runs locally" and "how it runs in production."
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  return app;
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`InternSage API listening on port ${port} (${process.env.NODE_ENV ?? 'development'})`);
}

// Only auto-start a listening server when this file is actually run
// directly (local dev / a traditional host's start command). When
// imported by api/index.ts for Vercel, `require.main !== module`, so
// this block is skipped and only `createApp` is used.
if (require.main === module) {
  bootstrap().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Fatal startup error:', error.message);
    process.exit(1);
  });
}
