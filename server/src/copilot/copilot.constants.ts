// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Copilot DI tokens
 *
 */

export const COPILOT_INTENT_PARSER = Symbol('COPILOT_INTENT_PARSER');
export const COPILOT_REPLY_GENERATOR = Symbol('COPILOT_REPLY_GENERATOR');

/** How many prior messages (both sides) CopilotService hands a
 * reply generator as history — enough for real continuity in a
 * conversation without letting an old thread balloon every prompt. */
export const COPILOT_HISTORY_TURNS = 12;
