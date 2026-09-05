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

export function containsProtectedCharacteristic(question: string): boolean {
  const lower = question.toLowerCase();
  return PROTECTED_KEYWORDS.some((keyword) => lower.includes(keyword));
}
