/**
 * InternSage — AuditModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUDIT-001
 * File   : src/common/audit/audit.module.ts
 */

import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
