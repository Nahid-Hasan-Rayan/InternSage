/**
 * InternSage — Prisma database service
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-PRISMA-001
 * File   : src/common/prisma/prisma.service.ts
 *
 * Wraps PrismaClient as a Nest-managed singleton so every module
 * shares one connection pool instead of opening its own.
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Never log raw query parameters in production — they can
      // contain personal data (emails, names). Query *shape*
      // logging is fine for debugging locally.
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
