/**
 * InternSage — Vercel serverless entrypoint
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!cachedHandler) {
    // Dynamically import the compiled main module
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