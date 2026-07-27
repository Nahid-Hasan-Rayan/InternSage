/**
 * InternSage — Copilot intent shape
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-COPILOT-001
 * File   : src/copilot/intent-parser/intent-parser.interface.ts
 *
 * This is the entire surface a natural-language query is allowed
 * to become. CopilotService builds one Prisma query from this
 * object and nothing else — there is no path from a recruiter's
 * question to a raw or string-built query. Whether the object
 * comes from OpenRouterIntentParser or RuleBasedIntentParser, it
 * has to fit this shape, so an LLM hallucinating a field name it
 * shouldn't have simply produces a field TypeScript won't compile
 * and CopilotService will never read.
 */

export interface CopilotIntent {
  skillNames?: string[];
  minAuthenticity?: number;
  major?: string;
  universityName?: string;
  location?: string;
  year?: number;
}

export interface IntentParser {
  readonly name: string;
  parse(question: string, knownSkillNames: string[]): Promise<CopilotIntent>;
}
