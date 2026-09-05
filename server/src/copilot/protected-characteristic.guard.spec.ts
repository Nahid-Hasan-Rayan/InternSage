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
});
