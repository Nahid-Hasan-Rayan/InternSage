/**
 * InternSage — Vercel serverless entrypoint
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-VERCEL-001
 * File   : api/index.ts
 *
 * Vercel treats any file under /api as its own serverless function.
 * `vercel.json` at the repo root rewrites every path to THIS
 * function, so NestJS's own router (not Vercel's file-based routing)
 * decides what handles what — the app behaves identically to running
 * `npm run start:dev` locally, just fronted by Vercel's runtime
 * instead of Node's own HTTP server listening on a port.
 *
 * The Nest app is built once per warm serverless instance and reused
 * across invocations (`cachedApp` below) — rebuilding the whole
 * dependency graph (Prisma connection, Passport strategy, every
 * module) on every single request would add real, avoidable latency.
 * This is the standard pattern for running Nest/Express on Vercel;
 * Vercel spins up a fresh instance (cold start) only when needed and
 * reuses warm ones for the requests that follow.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../dist/main';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  const handlerFn = cachedHandler;
  if (!handlerFn) {
    // Unreachable in practice (the block above always assigns it),
    // but this keeps the call below provably non-null to the
    // compiler instead of relying on cross-branch narrowing of a
    // reassigned outer `let`.
    throw new Error('Failed to initialize the Nest application handler.');
  }
  handlerFn(req, res);
}
