// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — AuditModule
 *
 */

import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
