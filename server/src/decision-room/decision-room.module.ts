// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — DecisionRoomModule
 *
 */
import { Module } from '@nestjs/common';
import { DecisionRoomController } from './decision-room.controller';
import { DecisionRoomService } from './decision-room.service';

@Module({
  controllers: [DecisionRoomController],
  providers: [DecisionRoomService],
  exports: [DecisionRoomService],
})
export class DecisionRoomModule {}
