// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotController
 *
 * Open to STUDENT, RECRUITER, and UNIVERSITY — Sage's grounding
 * differs per role (see CopilotService), but every signed-in account
 * except ADMIN gets a copilot that actually talks back, always.
 */

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CopilotService } from './copilot.service';
import { CopilotQueryDto } from './dto/copilot-query.dto';

@Controller('copilot')
@Roles(Role.STUDENT, Role.RECRUITER, Role.UNIVERSITY)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('query')
  query(@CurrentUser() user: AuthenticatedUser, @Body() dto: CopilotQueryDto) {
    return this.copilotService.query(user.id, user.role, dto.question, dto.conversationId);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.copilotService.listConversations(user.id);
  }

  @Get('conversations/:id')
  getConversation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.copilotService.getConversation(user.id, id);
  }
}
