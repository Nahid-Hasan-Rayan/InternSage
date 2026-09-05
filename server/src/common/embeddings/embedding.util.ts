// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — embedding.util
 *
 * v1 ONLY. The Master Blueprint's target architecture for matching
 * is sentence-transformers embeddings computed by a separate
 * ai-service, stored in pgvector, compared via `<=>` cosine-distance
 * queries. That service doesn't exist in this project yet — building
 * it needs a Python/FastAPI app, a hosting decision for it, and (per
 * the person's stated stack) ideally something free/low-cost, none
 * of which this pass covers.
 *
 * So this is an honest placeholder: `embedText` uses the "hashing
 * trick" (feature hashing, the same technique behind e.g.
 * scikit-learn's HashingVectorizer or Vowpal Wabbit) — deterministic,
 * needs no model download, no API call, no cost, and runs entirely
 * in this process. It tokenizes text, hashes each token into a fixed
 * number of buckets with a signed increment (reduces hash-collision
 * bias versus unsigned counting), then L2-normalizes. It captures
 * crude lexical overlap ("these two texts share a lot of the same
 * words"), NOT semantic similarity ("these two texts mean the same
 * thing despite using different words") — the latter is what a real
 * embedding model provides and this does not.
 *
 * MatchingService already treats this as a MINOR signal
 * (projectsWeight, not skillsWeight) precisely because of this
 * limitation — the primary, trustworthy signal is the real skill-set
 * intersection (JobRequiredSkill vs UserSkill), not this text score.
 * Swapping this file's internals for a real embedding-service call
 * later doesn't require changing MatchingService at all — same
 * `embedText`/`cosineSimilarity` function signatures either way.
 */

const VECTOR_DIMENSIONS = 128;

function hashToken(token: string, dimensions: number): { bucket: number; sign: 1 | -1 } {
  // FNV-1a — a small, fast, well-distributed non-cryptographic hash.
  // Good enough here: this only needs to spread tokens across
  // buckets evenly, not resist adversarial collisions.
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  return {
    bucket: unsigned % dimensions,
    // One extra bit of the same hash decides the sign — this is
    // what keeps unrelated-but-colliding tokens from just adding up
    // into a false similarity signal.
    sign: (unsigned & 1) === 0 ? 1 : -1,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .match(/[a-z0-9]+/g) ?? [];
}

export function embedText(text: string, dimensions: number = VECTOR_DIMENSIONS): number[] {
  const vector = new Array(dimensions).fill(0);
  for (const token of tokenize(text)) {
    const { bucket, sign } = hashToken(token, dimensions);
    vector[bucket] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('cosineSimilarity requires equal-length vectors.');
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    // A zero vector (empty/whitespace-only text) has no defined
    // direction — 0 similarity is the honest answer, not NaN or a
    // silently-passing 1.
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
