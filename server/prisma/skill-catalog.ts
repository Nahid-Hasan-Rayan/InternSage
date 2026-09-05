// © 2026 Nahid Hasan Rayan. All rights reserved.

import { SkillCategory } from '@prisma/client';

// The catalog was software-only for a while, which doesn't fit
// MJIIT's actual mix of programs — a mechanical or business student
// had nothing to even claim on their CV, and skill-tagging on
// aggregated postings could only ever match tech roles. This is the
// standard set of tools/terms each field actually uses, one list
// spanning every SkillCategory value, kept separate from seed.ts so
// it's easy to check the spread stays real (see the spec next to
// this file) instead of quietly drifting back to one category.
export const SKILL_CATALOG: Array<{ name: string; category: SkillCategory }> = [
  { name: 'JavaScript', category: 'SOFTWARE' },
  { name: 'React', category: 'SOFTWARE' },
  { name: 'Node.js', category: 'SOFTWARE' },
  { name: 'PostgreSQL', category: 'SOFTWARE' },
  { name: 'Python', category: 'SOFTWARE' },
  { name: 'TypeScript', category: 'SOFTWARE' },
  { name: 'SQL', category: 'SOFTWARE' },
  { name: 'Docker', category: 'SOFTWARE' },
  { name: 'Git', category: 'SOFTWARE' },
  { name: 'AWS', category: 'SOFTWARE' },

  { name: 'AutoCAD', category: 'MECHANICAL' },
  { name: 'SolidWorks', category: 'MECHANICAL' },
  { name: 'CATIA', category: 'MECHANICAL' },
  { name: 'ANSYS', category: 'MECHANICAL' },
  { name: 'Finite Element Analysis', category: 'MECHANICAL' },
  { name: 'Thermodynamics', category: 'MECHANICAL' },
  { name: 'CNC Machining', category: 'MECHANICAL' },

  { name: 'Circuit Design', category: 'ELECTRICAL' },
  { name: 'PCB Design', category: 'ELECTRICAL' },
  { name: 'PLC Programming', category: 'ELECTRICAL' },
  { name: 'MATLAB', category: 'ELECTRICAL' },
  { name: 'Embedded Systems', category: 'ELECTRICAL' },
  { name: 'Power Systems Analysis', category: 'ELECTRICAL' },

  { name: 'Process Simulation', category: 'CHEMICAL' },
  { name: 'Aspen HYSYS', category: 'CHEMICAL' },
  { name: 'Reactor Design', category: 'CHEMICAL' },
  { name: 'Mass Transfer', category: 'CHEMICAL' },
  { name: 'HAZOP', category: 'CHEMICAL' },

  { name: 'Project Management', category: 'BUSINESS' },
  { name: 'Digital Marketing', category: 'BUSINESS' },
  { name: 'Business Analysis', category: 'BUSINESS' },
  { name: 'Supply Chain Management', category: 'BUSINESS' },
  { name: 'Salesforce', category: 'BUSINESS' },
  { name: 'Excel', category: 'BUSINESS' },

  { name: 'Financial Accounting', category: 'ACCOUNTING' },
  { name: 'Auditing', category: 'ACCOUNTING' },
  { name: 'Taxation', category: 'ACCOUNTING' },
  { name: 'Financial Modeling', category: 'ACCOUNTING' },
  { name: 'SAP', category: 'ACCOUNTING' },

  { name: 'Econometrics', category: 'ECONOMICS' },
  { name: 'Statistical Analysis', category: 'ECONOMICS' },
  { name: 'R', category: 'ECONOMICS' },
  { name: 'Stata', category: 'ECONOMICS' },
  { name: 'Economic Forecasting', category: 'ECONOMICS' },

  { name: 'Public Speaking', category: 'OTHER' },
  { name: 'Technical Writing', category: 'OTHER' },
  { name: 'Data Visualization', category: 'OTHER' },
];
