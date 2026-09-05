// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotController
 *
 */

import { Body, Controller, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CopilotService } from './copilot.service';
import { CopilotQueryDto } from './dto/copilot-query.dto';

@Controller('copilot')
@Roles(Role.RECRUITER)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('query')
  query(@CurrentUser() user: AuthenticatedUser, @Body() dto: CopilotQueryDto) {
    return this.copilotService.query(user.id, dto.question);
  }
}
