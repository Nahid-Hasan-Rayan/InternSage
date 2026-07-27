/**
 * InternSage — OpenRouterIntentParser
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-COPILOT-003
 * File   : src/copilot/intent-parser/openrouter-intent-parser.ts
 *
 * This is the "server-side LLM call mapped to a constrained query"
 * the Blueprint describes for Sage Copilot — OpenRouter instead of
 * a direct Anthropic key, per the project's actual stack. The model
 * is asked to return strict JSON matching CopilotIntent and nothing
 * else; the response is parsed defensively and any field outside
 * CopilotIntent's shape is simply dropped, never trusted as-is.
 * OPENROUTER_MODEL defaults to a free-tier model — OpenRouter
 * rotates which models carry the ":free" suffix, so check
 * https://openrouter.ai/models?max_price=0 if this one stops
 * working and update the env var, no code change needed.
 * Falls back to RuleBasedIntentParser whenever there's no API key,
 * the request fails, or the response isn't valid JSON — Copilot
 * must keep working even with zero budget or an OpenRouter outage.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CopilotIntent, IntentParser } from './intent-parser.interface';
import { RuleBasedIntentParser } from './rule-based-intent-parser';

const DEFAULT_FREE_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

@Injectable()
export class OpenRouterIntentParser implements IntentParser {
  readonly name = 'openrouter';
  private readonly logger = new Logger(OpenRouterIntentParser.name);

  constructor(private readonly ruleBasedParser: RuleBasedIntentParser) {}

  async parse(question: string, knownSkillNames: string[]): Promise<CopilotIntent> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return this.ruleBasedParser.parse(question, knownSkillNames);
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter asks free-tier callers to identify the app —
          // harmless to omit, but good etiquette on a free resource.
          'HTTP-Referer': process.env.PUBLIC_APP_URL ?? 'https://internsage.app',
          'X-Title': 'InternSage Sage Copilot',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL ?? DEFAULT_FREE_MODEL,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content:
                'Extract search filters from a recruiter\'s question about candidates. ' +
                'Reply with ONLY a JSON object with optional keys: skillNames (array of ' +
                `strings, only from this exact list: ${knownSkillNames.join(', ')}), ` +
                'minAuthenticity (0-100 number), major (string), universityName (string), ' +
                'location (string), year (1-6 number). Never include any other keys. ' +
                'If the question asks about gender, ethnicity, race, religion, age, ' +
                'nationality, or disability, reply with exactly {} and nothing else.',
            },
            { role: 'user', content: question },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.warn(`OpenRouter responded ${response.status}; falling back to rule-based parsing.`);
        return this.ruleBasedParser.parse(question, knownSkillNames);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        return this.ruleBasedParser.parse(question, knownSkillNames);
      }

      const parsed = JSON.parse(content);
      return this.sanitize(parsed, knownSkillNames);
    } catch (error) {
      this.logger.warn(`OpenRouter call failed (${(error as Error).message}); falling back to rule-based parsing.`);
      return this.ruleBasedParser.parse(question, knownSkillNames);
    }
  }

  /** Never trust the model's JSON as-is — only known-safe fields, in-range values, survive. */
  private sanitize(raw: unknown, knownSkillNames: string[]): CopilotIntent {
    if (typeof raw !== 'object' || raw === null) {
      return {};
    }
    const source = raw as Record<string, unknown>;
    const intent: CopilotIntent = {};

    if (Array.isArray(source.skillNames)) {
      const allowed = new Set(knownSkillNames.map((s) => s.toLowerCase()));
      intent.skillNames = source.skillNames
        .filter((s): s is string => typeof s === 'string' && allowed.has(s.toLowerCase()));
    }
    if (typeof source.minAuthenticity === 'number') {
      intent.minAuthenticity = Math.max(0, Math.min(100, source.minAuthenticity));
    }
    if (typeof source.major === 'string') {
      intent.major = source.major.slice(0, 100);
    }
    if (typeof source.universityName === 'string') {
      intent.universityName = source.universityName.slice(0, 100);
    }
    if (typeof source.location === 'string') {
      intent.location = source.location.slice(0, 100);
    }
    if (typeof source.year === 'number') {
      intent.year = Math.max(1, Math.min(6, Math.round(source.year)));
    }
    return intent;
  }
}
