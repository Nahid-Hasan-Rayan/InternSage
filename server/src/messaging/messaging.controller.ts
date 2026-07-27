/**
 * InternSage — MessagingController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MSG-CTRL-001
 * File   : src/messaging/messaging.controller.ts
 */

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('applications/:applicationId/messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('applicationId') applicationId: string) {
    return this.messagingService.listMessages(user.id, applicationId);
  }

  @Post()
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user.id, applicationId, dto.body);
  }
}
