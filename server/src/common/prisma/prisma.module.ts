// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Prisma module
 *
 * Marked @Global so every feature module can inject PrismaService
 * without re-importing this module everywhere — a deliberate,
 * narrow exception to normal module scoping, appropriate for a
 * single shared database client.
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
