// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Protected characteristic guard
 *
 * A keyword denylist, checked against the raw question before it
 * ever reaches an intent parser — this is defense-in-depth on top
 * of the OpenRouter system prompt's own instruction to refuse the
 * same categories, so a query is blocked even if the LLM call is
 * skipped entirely (RuleBasedIntentParser path) or a model ignores
 * its system prompt. Not exhaustive by design — broad enough to
 * catch the categories the Blueprint names (gender, ethnicity,
 * religion, age, disability, nationality), not a claim of
 * completeness.
 */

const PROTECTED_KEYWORDS = [
  'gender', 'male', 'female', 'man', 'woman', 'transgender', 'non-binary',
  'race', 'ethnicity', 'ethnic', 'nationality', 'national origin',
  'religion', 'religious', 'muslim', 'christian', 'hindu', 'buddhist', 'jewish', 'sikh',
  'age', 'years old', 'birth year', 'date of birth',
  'disability', 'disabled', 'handicap',
  'pregnant', 'pregnancy', 'maternity',
  'sexual orientation', 'lgbt',
];

// Whole-word match, not substring — a naive `.includes()` here blocked completely
// innocuous questions: "how many people applied?" contains the substring "man" (inside
// "many"), and "age" alone matches inside "average", "manage", "package", "engage",
// "message", "language", "usage" — none of which have anything to do with a protected
// characteristic. \b on both sides means "man" only fires for the standalone word "man",
// not as a substring of a longer one.
const PROTECTED_PATTERNS = PROTECTED_KEYWORDS.map(
  (keyword) => new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
);

export function containsProtectedCharacteristic(question: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(question));
}
