/**
 * InternSage — Vercel serverless entrypoint
 * Uses require to avoid TypeScript static import resolution error.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!cachedHandler) {
    // require bypasses TypeScript compile-time checking – dist/main will exist at runtime
    const { createApp } = require('../dist/main');
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