// © 2026 Nahid Hasan Rayan. All rights reserved.

import { RuleBasedIntentParser } from './rule-based-intent-parser';

describe('RuleBasedIntentParser', () => {
  const parser = new RuleBasedIntentParser();

  it('only ever matches skills that exist in the known catalog — never invents one from free text', async () => {
    const result = await parser.parse('who knows React and also Quantum Computing', ['React']);
    expect(result.skillNames).toEqual(['React']);
  });

  it('extracts an authenticity threshold phrased a few common ways', async () => {
    expect((await parser.parse('authenticity above 80', [])).minAuthenticity).toBe(80);
    expect((await parser.parse('authenticity score of 65', [])).minAuthenticity).toBe(65);
  });

  it('clamps an authenticity value over 100 rather than passing it through', async () => {
    const result = await parser.parse('authenticity over 150', []);
    expect(result.minAuthenticity).toBe(100);
  });

  it('recognizes "final year" as year 4', async () => {
    const result = await parser.parse('any final-year students', []);
    expect(result.year).toBe(4);
  });

  it('recognizes an explicit year number', async () => {
    const result = await parser.parse('year 2 students only', []);
    expect(result.year).toBe(2);
  });

  it('returns an empty intent for a question that matches nothing recognizable', async () => {
    const result = await parser.parse('hello there', []);
    expect(result).toEqual({});
  });
});
