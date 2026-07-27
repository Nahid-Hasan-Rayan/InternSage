/**
 * InternSage — Vercel serverless entrypoint
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-VERCEL-002
 * File   : api/index.ts
 *
 * Uses dynamic import to load the compiled NestJS app from `dist/main`
 * at runtime, avoiding a compile-time error when `dist` doesn't exist yet.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!cachedHandler) {
    // Dynamically import the compiled main module (avoids compile-time error)
    const { createApp } = await import('../dist/main');
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  const handlerFn = cachedHandler;
  if (!handlerFn) {
    throw new Error('Failed to initialize the Nest application handler.');
  }
  handlerFn(req, res);
}