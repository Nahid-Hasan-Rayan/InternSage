// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — OpenRouterReplyGenerator
 *
 * The natural-language half of Sage Copilot: OpenRouterIntentParser
 * turns a question into a CopilotIntent (what to search for), this
 * turns the resulting CopilotContext (what was actually found) into
 * the sentence Sage says back. Two separate LLM calls on purpose —
 * intent extraction stays a narrow, single-shot structured-output
 * task; reply generation is the one place conversation history and
 * persona actually matter, and keeping them apart means a prompt-
 * injection risk in one path can't smuggle itself into the other's
 * output shape.
 *
 * The model NEVER receives a raw database query surface or write
 * access — it receives a pre-computed CopilotContext.data object
 * (already role-scoped and already filtered by CopilotService) and
 * is instructed to talk about that data only. Same FREE_MODEL_CANDIDATES/
 * timeout/fallback shape as OpenRouterIntentParser, deliberately kept
 * in sync with it — see that file's header comment for the full
 * reasoning on the model list and the resilience chain.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ReplyGenerator, CopilotContext } from './reply-generator.interface';
import { TemplateReplyGenerator } from './template-reply-generator';
import { buildSystemPrompt } from '../sage-persona';

const FREE_MODEL_CANDIDATES = [
  'meta-llama/llama-3.3-8b-instruct:free',
  'openrouter/free',
];

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REPLY_CHARS = 2_000;

@Injectable()
export class OpenRouterReplyGenerator implements ReplyGenerator {
  readonly name = 'openrouter';
  private readonly logger = new Logger(OpenRouterReplyGenerator.name);

  constructor(private readonly templateGenerator: TemplateReplyGenerator) {}

  async generate(context: CopilotContext): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return this.templateGenerator.generate(context);
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
          'HTTP-Referer': process.env.PUBLIC_APP_URL ?? 'https://internsage.app',
          'X-Title': 'InternSage Sage Copilot',
        },
        body: JSON.stringify({
          models: this.configuredModels(),
          temperature: 0.4,
          max_tokens: 500,
          messages: [
            { role: 'system', content: buildSystemPrompt(context.role) },
            {
              role: 'system',
              content:
                'Grounding data for THIS question only — every claim in your reply must trace back ' +
                `to something in here, never outside it:\n${JSON.stringify(context.data)}`,
            },
            ...context.history.map((turn) => ({
              role: turn.sender === 'USER' ? ('user' as const) : ('assistant' as const),
              content: turn.content,
            })),
            { role: 'user', content: context.question },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.warn(`OpenRouter responded ${response.status}; falling back to template reply.`);
        return this.templateGenerator.generate(context);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        return this.templateGenerator.generate(context);
      }

      return content.trim().slice(0, MAX_REPLY_CHARS);
    } catch (error) {
      const reason = controller.signal.aborted ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : (error as Error).message;
      this.logger.warn(`OpenRouter call failed (${reason}); falling back to template reply.`);
      return this.templateGenerator.generate(context);
    } finally {
      clearTimeout(timeout);
    }
  }

  private configuredModels(): string[] {
    const pinned = process.env.OPENROUTER_MODEL;
    if (!pinned) return FREE_MODEL_CANDIDATES;
    return [pinned, ...FREE_MODEL_CANDIDATES.filter((m) => m !== pinned)];
  }
}
