import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/main';

let cachedHandler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  if (!cachedHandler) {
    throw new Error('Failed to initialize the Nest application handler.');
  }
  cachedHandler(req, res);
}