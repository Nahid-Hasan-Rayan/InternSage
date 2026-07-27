/**
 * InternSage — Vercel serverless entrypoint
 * Loads compiled NestJS from ./dist/main (copied during build)
 * .
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!cachedHandler) {
    // Now requires from ./dist/main (relative to api/ folder)
    const { createApp } = require('./dist/main');
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