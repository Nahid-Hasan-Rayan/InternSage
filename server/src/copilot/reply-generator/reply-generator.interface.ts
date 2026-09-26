// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Reply generator contract
 *
 * Mirrors the IntentParser split (OpenRouter first, rule-based
 * fallback always available) one layer further downstream: parsing
 * turns a question into a CopilotIntent, this turns a CopilotContext
 * (the intent's results plus role-scoped grounding data) into the
 * words Sage actually says. Two implementations, same contract, so
 * CopilotService never has to know or care which one answered.
 */

import { Role } from '@prisma/client';

export interface ConversationTurn {
  sender: 'USER' | 'SAGE';
  content: string;
}

/** Everything a reply is allowed to be grounded in. Deliberately a
 * closed shape, same reasoning as CopilotIntent: a generator can only
 * ever talk about what's actually in here, never reach past it. */
export interface CopilotContext {
  role: Role;
  question: string;
  /** Prior turns in this conversation, oldest first, already capped by CopilotService. */
  history: ConversationTurn[];
  /** Role-scoped grounding data — see CopilotService's buildRecruiterContext /
   * buildStudentContext / buildUniversityContext for what each role's shape actually is. */
  data: Record<string, unknown>;
}

export interface ReplyGenerator {
  readonly name: string;
  generate(context: CopilotContext): Promise<string>;
}
