import 'reflect-metadata';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * Builds and configures the Nest application.
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

// Vercel's zero-config runtime imports this file directly.
// The guard is removed so bootstrap() always runs.
bootstrap().catch((error) => {
  console.error('Fatal startup error:', error.message);
  process.exit(1);
});