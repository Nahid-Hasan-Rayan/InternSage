"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedText = embedText;
exports.cosineSimilarity = cosineSimilarity;
const VECTOR_DIMENSIONS = 128;
function hashToken(token, dimensions) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    const unsigned = hash >>> 0;
    return {
        bucket: unsigned % dimensions,
        sign: (unsigned & 1) === 0 ? 1 : -1,
    };
}
function tokenize(text) {
    return text
        .toLowerCase()
        .match(/[a-z0-9]+/g) ?? [];
}
function embedText(text, dimensions = VECTOR_DIMENSIONS) {
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
function cosineSimilarity(a, b) {
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
        return 0;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
//# sourceMappingURL=embedding.util.js.map