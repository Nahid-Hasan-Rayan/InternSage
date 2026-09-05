// © 2026 Nahid Hasan Rayan. All rights reserved.

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  SkillCategory: {
    SOFTWARE: 'SOFTWARE',
    MECHANICAL: 'MECHANICAL',
    ELECTRICAL: 'ELECTRICAL',
    CHEMICAL: 'CHEMICAL',
    BUSINESS: 'BUSINESS',
    ACCOUNTING: 'ACCOUNTING',
    ECONOMICS: 'ECONOMICS',
    OTHER: 'OTHER',
  },
}));

import { SKILL_CATALOG } from '../../../prisma/skill-catalog';

const ALL_CATEGORIES = ['SOFTWARE', 'MECHANICAL', 'ELECTRICAL', 'CHEMICAL', 'BUSINESS', 'ACCOUNTING', 'ECONOMICS', 'OTHER'];

describe('SKILL_CATALOG', () => {
  it('covers every SkillCategory at least once — not just SOFTWARE', () => {
    const present = new Set(SKILL_CATALOG.map((s) => s.category));
    for (const category of ALL_CATEGORIES) {
      expect(present.has(category as any)).toBe(true);
    }
  });

  it('has no duplicate skill names', () => {
    const names = SKILL_CATALOG.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has no blank names', () => {
    for (const s of SKILL_CATALOG) {
      expect(s.name.trim().length).toBeGreaterThan(0);
    }
  });
});
