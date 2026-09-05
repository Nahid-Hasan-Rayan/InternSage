// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — OpenRouterIntentParser
 *
 * This is the "server-side LLM call mapped to a constrained query"
 * the Blueprint describes for Sage Copilot — OpenRouter instead of
 * a direct Anthropic key, per the project's actual stack. The model
 * is asked to return strict JSON matching CopilotIntent and nothing
 * else; the response is parsed defensively and any field outside
 * CopilotIntent's shape is simply dropped, never trusted as-is.
 *
 * FREE_MODEL_CANDIDATES is a priority-ordered list, not one hardcoded
 * model — OpenRouter's `models` field tries each in order within the
 * same request and moves on if one is down, deprecated, or rate-
 * limited, rather than failing the whole call over a single stale
 * ID. Free-tier models get rotated out with no warning (this file
 * used to default to meta-llama/llama-3.1-8b-instruct:free, which
 * OpenRouter has since retired in favor of the 3.3 release — that's
 * exactly the failure mode this list exists to survive). Check
 * https://openrouter.ai/models?max_price=0 if every candidate here
 * ever goes stale at once, which is unlikely but not impossible.
 *
 * Falls back to RuleBasedIntentParser whenever there's no API key,
 * every candidate model fails, the request times out, or the
 * response isn't valid JSON — Copilot must keep working even with
 * zero budget or an OpenRouter outage.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CopilotIntent, IntentParser } from './intent-parser.interface';
import { RuleBasedIntentParser } from './rule-based-intent-parser';

const FREE_MODEL_CANDIDATES = [
  'meta-llama/llama-3.3-8b-instruct:free',
  'openrouter/free', // OpenRouter's own router — self-maintained, always points at whatever free model is currently up, the most durable fallback available
];

const REQUEST_TIMEOUT_MS = 8_000;

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter asks free-tier callers to identify the app —
          // harmless to omit, but good etiquette on a free resource.
          'HTTP-Referer': process.env.PUBLIC_APP_URL ?? 'https://internsage.app',
          'X-Title': 'InternSage Sage Copilot',
        },
        body: JSON.stringify({
          models: this.configuredModels(),
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
                'nationality, or disability, reply with exactly {} and nothing else. ' +
                'Reply with the raw JSON object only — no markdown code fences, no ' +
                'explanation before or after it.',
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

      const parsed = JSON.parse(this.stripCodeFence(content));
      return this.sanitize(parsed, knownSkillNames);
    } catch (error) {
      const reason = controller.signal.aborted ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : (error as Error).message;
      this.logger.warn(`OpenRouter call failed (${reason}); falling back to rule-based parsing.`);
      return this.ruleBasedParser.parse(question, knownSkillNames);
    } finally {
      clearTimeout(timeout);
    }
  }

  /** OPENROUTER_MODEL, if set, goes first — everything else is the
   * built-in fallback chain. Lets an operator pin a specific model
   * without losing the resilience of the rest of the list. */
  private configuredModels(): string[] {
    const pinned = process.env.OPENROUTER_MODEL;
    if (!pinned) return FREE_MODEL_CANDIDATES;
    return [pinned, ...FREE_MODEL_CANDIDATES.filter((m) => m !== pinned)];
  }

  /** Smaller free-tier models don't always honor "JSON only" —
   * stripping a ```json ... ``` wrapper here means one common
   * formatting slip doesn't throw away a perfectly good answer. */
  private stripCodeFence(content: string): string {
    const trimmed = content.trim();
    const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    return match ? match[1] : trimmed;
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
