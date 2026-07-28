/**
 * ============================================================
 *  InternSage backend — application entry point
 * ------------------------------------------------------------
 *  Author : Nahid Hasan Rayan
 *  Marker : NHR-BE-MAIN-002
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
 *
 *  This file has NO exports, on purpose — matching Vercel's own
 *  zero-config NestJS entrypoint example exactly. Vercel's build
 *  inspects this file's exports to decide how to run it (bare
 *  "server" mode vs. a request-handler-function mode); a named
 *  export with no default previously caused "Invalid export
 *  found... must be a function or server" at runtime. If this
 *  file ever needs to export something again (e.g. for e2e tests
 *  that build an app instance without listening), put that in a
 *  separate file and have both this file and the tests import it
 *  — never export anything from the file Vercel treats as the
 *  entrypoint.
 * ============================================================
 */

import 'reflect-metadata';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

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

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`InternSage API listening on port ${port} (${process.env.NODE_ENV ?? 'development'})`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', error);
});