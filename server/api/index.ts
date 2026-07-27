/**
 * InternSage — Vercel serverless entrypoint with error logging
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (!cachedHandler) {
      const { createApp } = require('./main');
      const app = await createApp();
      await app.init();
      cachedHandler = app.getHttpAdapter().getInstance();
    }
    const handlerFn = cachedHandler;
    if (!handlerFn) {
      throw new Error('Handler initialization failed.');
    }
    handlerFn(req, res);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN',
    });
  }
}