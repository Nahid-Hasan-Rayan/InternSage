// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotModule
 *
 */

import { Module } from '@nestjs/common';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { COPILOT_INTENT_PARSER } from './copilot.constants';
import { OpenRouterIntentParser } from './intent-parser/openrouter-intent-parser';
import { RuleBasedIntentParser } from './intent-parser/rule-based-intent-parser';

@Module({
  controllers: [CopilotController],
  providers: [
    RuleBasedIntentParser,
    OpenRouterIntentParser,
    { provide: COPILOT_INTENT_PARSER, useExisting: OpenRouterIntentParser },
    CopilotService,
  ],
})
export class CopilotModule {}
