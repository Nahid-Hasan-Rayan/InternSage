/**
 * InternSage — MessagingModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MSG-MOD-001
 * File   : src/messaging/messaging.module.ts
 */

import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
