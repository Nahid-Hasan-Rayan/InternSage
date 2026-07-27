/**
 * InternSage — AuditService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUDIT-SVC-001
 * File   : src/common/audit/audit.service.ts
 *
 * `log()` never throws back into the caller — a failed audit write
 * must not block the real action it's describing, same fire-and-
 * forget shape as AnalyticsService's record().
 */

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogInput {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write audit log: ${(error as Error).message}`);
    }
  }
}
