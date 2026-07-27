/**
 * InternSage — embedding.util unit tests
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-EMBED-TEST-001
 * File   : src/common/embeddings/embedding.util.spec.ts
 */

import { cosineSimilarity, embedText } from './embedding.util';

describe('embedText / cosineSimilarity', () => {
  it('is deterministic — same text always produces the same vector', () => {
    const a = embedText('NestJS backend engineer with PostgreSQL experience');
    const b = embedText('NestJS backend engineer with PostgreSQL experience');
    expect(a).toEqual(b);
  });

  it('scores near-identical text higher than completely unrelated text', () => {
    const base = embedText('React frontend developer with TypeScript and Tailwind');
    const similar = embedText('React frontend engineer using TypeScript and Tailwind CSS');
    const unrelated = embedText('Mechanical engineering intern with SolidWorks and CAD experience');

    const similarScore = cosineSimilarity(base, similar);
    const unrelatedScore = cosineSimilarity(base, unrelated);

    expect(similarScore).toBeGreaterThan(unrelatedScore);
  });

  it('gives identical text a similarity of 1', () => {
    const vector = embedText('same text twice');
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
  });

  it('returns 0 similarity for empty/whitespace-only text instead of NaN', () => {
    const empty = embedText('   ');
    const real = embedText('some real content here');
    expect(cosineSimilarity(empty, real)).toBe(0);
    expect(Number.isNaN(cosineSimilarity(empty, real))).toBe(false);
  });

  it('throws on mismatched vector lengths rather than silently misaligning', () => {
    const a = embedText('text', 64);
    const b = embedText('text', 128);
    expect(() => cosineSimilarity(a, b)).toThrow();
  });
});
