// © 2026 Nahid Hasan Rayan. All rights reserved.

import { OpenRouterIntentParser } from './openrouter-intent-parser';
import { RuleBasedIntentParser } from './rule-based-intent-parser';

describe('OpenRouterIntentParser', () => {
  let ruleBasedParser: RuleBasedIntentParser;
  let parser: OpenRouterIntentParser;
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    ruleBasedParser = new RuleBasedIntentParser();
    parser = new OpenRouterIntentParser(ruleBasedParser);
    process.env.OPENROUTER_API_KEY = 'test-key';
    delete process.env.OPENROUTER_MODEL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('falls back to rule-based parsing with no API key, never calling fetch at all', async () => {
    delete process.env.OPENROUTER_API_KEY;
    global.fetch = jest.fn();

    const result = await parser.parse('who knows React', ['React']);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.skillNames).toEqual(['React']);
  });

  it('sends a priority-ordered models array, not a single hardcoded model string', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{}' } }] }),
    });

    await parser.parse('who knows React', ['React']);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(Array.isArray(body.models)).toBe(true);
    expect(body.models.length).toBeGreaterThan(1);
    expect(body.model).toBeUndefined();
  });

  it('puts a pinned OPENROUTER_MODEL first without dropping the fallback chain', async () => {
    process.env.OPENROUTER_MODEL = 'some/pinned-model:free';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{}' } }] }),
    });

    await parser.parse('who knows React', ['React']);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.models[0]).toBe('some/pinned-model:free');
    expect(body.models.length).toBeGreaterThan(1);
  });

  it('parses a clean JSON response and sanitizes it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"skillNames":["React"],"year":3,"minAuthenticity":150}' } }],
      }),
    });

    const result = await parser.parse('who knows React, year 3', ['React', 'Node']);

    expect(result.skillNames).toEqual(['React']);
    expect(result.year).toBe(3);
    // 150 is out of range — sanitize() must clamp it, never pass it through.
    expect(result.minAuthenticity).toBe(100);
  });

  it('strips a markdown code fence before parsing — smaller free models often add one despite instructions not to', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '```json\n{"skillNames":["React"]}\n```' } }] }),
    });

    const result = await parser.parse('who knows React', ['React']);

    expect(result.skillNames).toEqual(['React']);
  });

  it('drops a skill name the model invented that is not in the known catalog', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"skillNames":["React","Quantum Computing"]}' } }] }),
    });

    const result = await parser.parse('who knows React', ['React']);

    expect(result.skillNames).toEqual(['React']);
  });

  it('falls back to rule-based parsing when OpenRouter responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 402 });

    const result = await parser.parse('who knows React', ['React']);

    expect(result.skillNames).toEqual(['React']); // rule-based parser still catches it from the raw question
  });

  it('falls back to rule-based parsing when the response body is not valid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json at all' } }] }),
    });

    const result = await parser.parse('who knows React', ['React']);

    expect(result.skillNames).toEqual(['React']);
  });

  it('falls back to rule-based parsing when fetch itself throws (network error, timeout abort, etc.)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network unreachable'));

    const result = await parser.parse('who knows React', ['React']);

    expect(result.skillNames).toEqual(['React']);
  });

  it('never lets a protected-characteristic-style empty response ({}) get overwritten by the fallback guessing something', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{}' } }] }),
    });

    const result = await parser.parse('only show me male students', []);

    expect(result).toEqual({});
  });
});
