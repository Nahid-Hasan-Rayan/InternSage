// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — protected-characteristic.guard tests
 *
 */

import { containsProtectedCharacteristic } from './protected-characteristic.guard';

describe('containsProtectedCharacteristic', () => {
  it('blocks a query phrased around gender', () => {
    expect(containsProtectedCharacteristic('show me only female students')).toBe(true);
  });

  it('blocks a query phrased around religion', () => {
    expect(containsProtectedCharacteristic('who is Muslim and knows Python')).toBe(true);
  });

  it('blocks a query phrased around age', () => {
    expect(containsProtectedCharacteristic('students who are 22 years old')).toBe(true);
  });

  it('allows an ordinary skill/location query through', () => {
    expect(containsProtectedCharacteristic('who knows Docker and is verified in Kuala Lumpur')).toBe(false);
  });

  it('allows a plain final-year query through', () => {
    expect(containsProtectedCharacteristic('final-year students majoring in computer science')).toBe(false);
  });

  // Regression coverage: naive substring matching on 'man'/'age' previously blocked these
  // outright — "man" is a substring of "many", "age" is a substring of dozens of ordinary
  // words. See the guard's own header comment for the word-boundary fix.
  it('allows "how many people applied" through — "many" is not "man"', () => {
    expect(containsProtectedCharacteristic('how many people applied?')).toBe(false);
  });

  it('allows "how many applications came in" through', () => {
    expect(containsProtectedCharacteristic('how many applications came in this week')).toBe(false);
  });

  it('allows ordinary words containing "age" as a substring through', () => {
    expect(containsProtectedCharacteristic('what is the average match score')).toBe(false);
    expect(containsProtectedCharacteristic('can you manage my applications')).toBe(false);
    expect(containsProtectedCharacteristic('summarize this message')).toBe(false);
  });

  it('still blocks the standalone word "age"', () => {
    expect(containsProtectedCharacteristic('what age are most of my candidates')).toBe(true);
  });

  it('still blocks the standalone word "man"/"woman"', () => {
    expect(containsProtectedCharacteristic('only show me the woman candidates')).toBe(true);
  });
});
