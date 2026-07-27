/**
 * InternSage — Prisma module
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-PRISMA-002
 * File   : src/common/prisma/prisma.module.ts
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
