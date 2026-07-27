/**
 * InternSage — Health check endpoint
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-HEALTH-001
 * File   : src/health/health.controller.ts
 *
 * Deliberately public and dependency-light — a load balancer or
 * container orchestrator should be able to hit this without
 * needing a JWT, and it should keep working even if a downstream
 * dependency (e.g. the AI service) is degraded, so it only
 * reports on the database connection this process actually owns.
 */

import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database connection is unavailable.');
    }
    return { status: 'ok', service: 'internsage-backend', timestamp: new Date().toISOString() };
  }
}
