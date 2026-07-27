/**
 * InternSage — CopilotModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-COPILOT-MOD-001
 * File   : src/copilot/copilot.module.ts
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
