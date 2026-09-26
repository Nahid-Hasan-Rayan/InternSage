// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotModule
 *
 * Imports UniversityModule to reuse UniversityService's own
 * getDashboard/getAnalytics — see that module's export comment for
 * why Sage's UNIVERSITY-role grounding is never a second, divergent
 * computation of the same numbers.
 */

import { Module } from '@nestjs/common';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { UniversityModule } from '../university/university.module';
import { COPILOT_INTENT_PARSER, COPILOT_REPLY_GENERATOR } from './copilot.constants';
import { OpenRouterIntentParser } from './intent-parser/openrouter-intent-parser';
import { RuleBasedIntentParser } from './intent-parser/rule-based-intent-parser';
import { OpenRouterReplyGenerator } from './reply-generator/openrouter-reply-generator';
import { TemplateReplyGenerator } from './reply-generator/template-reply-generator';

@Module({
  imports: [UniversityModule],
  controllers: [CopilotController],
  providers: [
    RuleBasedIntentParser,
    OpenRouterIntentParser,
    { provide: COPILOT_INTENT_PARSER, useExisting: OpenRouterIntentParser },
    TemplateReplyGenerator,
    OpenRouterReplyGenerator,
    { provide: COPILOT_REPLY_GENERATOR, useExisting: OpenRouterReplyGenerator },
    CopilotService,
  ],
})
export class CopilotModule {}
