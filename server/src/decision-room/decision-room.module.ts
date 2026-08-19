/**
 * InternSage — DecisionRoomModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-DECISION-MOD-001
 * File   : src/decision-room/decision-room.module.ts
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
