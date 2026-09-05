// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MessagingModule
 *
 */

import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
