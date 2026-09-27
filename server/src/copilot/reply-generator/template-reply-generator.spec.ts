// © 2026 Nahid Hasan Rayan. All rights reserved.

jest.mock('@prisma/client', () => ({
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', UNIVERSITY: 'UNIVERSITY', ADMIN: 'ADMIN' },
}));

import { Role } from '@prisma/client';
import { TemplateReplyGenerator } from './template-reply-generator';
import { CopilotContext } from './reply-generator.interface';

function context(role: Role, data: Record<string, unknown>): CopilotContext {
  return { role, question: 'test question', history: [], data };
}

describe('TemplateReplyGenerator', () => {
  const generator = new TemplateReplyGenerator();

  describe('RECRUITER', () => {
    it('says there is no pool yet rather than an empty match list, when poolSize is 0', async () => {
      const reply = await generator.generate(context(Role.RECRUITER, { candidates: [], poolSize: 0 }));
      expect(reply.toLowerCase()).toContain("nobody");
    });

    it('suggests loosening a filter when the pool exists but nothing matched', async () => {
      const reply = await generator.generate(context(Role.RECRUITER, { candidates: [], poolSize: 10 }));
      expect(reply).toContain('10');
      expect(reply.toLowerCase()).toContain('loosen');
    });

    it('names each candidate\'s actual skills, not just major/year/university', async () => {
      const reply = await generator.generate(
        context(Role.RECRUITER, {
          poolSize: 3,
          candidates: [
            { major: 'Software Engineering', year: 3, universityName: 'UTM', skills: ['Python', 'SQL'] },
          ],
        }),
      );
      expect(reply).toContain('Python');
      expect(reply).toContain('SQL');
      expect(reply).toContain('Software Engineering');
    });

    it('names the candidate by fullName, not their raw userId', async () => {
      // Regression test: candidates used to carry no fullName at all, so a "who are your
      // top candidates?" question got hex user IDs back instead of names.
      const reply = await generator.generate(
        context(Role.RECRUITER, {
          poolSize: 1,
          candidates: [
            {
              userId: 'e289330a-91d1-4e2a-9c1a-000000000000',
              fullName: 'Aisyah Rahman',
              major: 'Software Engineering',
              year: 3,
              universityName: 'UTM',
              skills: ['React'],
            },
          ],
        }),
      );
      expect(reply).toContain('Aisyah Rahman');
      expect(reply).not.toContain('e289330a');
    });

    it('falls back to "Unnamed candidate" rather than a raw id when fullName is missing', async () => {
      const reply = await generator.generate(
        context(Role.RECRUITER, {
          poolSize: 1,
          candidates: [{ major: 'Data Science', year: 2, universityName: 'UTM', skills: [] }],
        }),
      );
      expect(reply).toContain('Unnamed candidate');
    });

    it('never invents a skill that was not in the data', async () => {
      const reply = await generator.generate(
        context(Role.RECRUITER, {
          poolSize: 1,
          candidates: [{ major: 'Data Science', year: 2, universityName: 'UTM', skills: [] }],
        }),
      );
      expect(reply).not.toContain('Python');
    });
  });

  describe('STUDENT', () => {
    it('points the student at filling in a CV when there is nothing to ground an answer in', async () => {
      const reply = await generator.generate(context(Role.STUDENT, { applications: [], matches: [] }));
      expect(reply.toLowerCase()).toContain('cv');
    });

    it('cites the actual application count and status, not a generic summary', async () => {
      const reply = await generator.generate(
        context(Role.STUDENT, {
          applications: [
            { title: 'Backend Engineer Intern', company: 'Padu Analytics', status: 'APPLIED' },
            { title: 'Data Analyst Intern', company: 'Padu Analytics', status: 'INTERVIEW' },
          ],
          matches: [],
          unverifiedSkills: [],
        }),
      );
      expect(reply).toContain('2');
    });

    it('names the strongest match and its missing skills', async () => {
      const reply = await generator.generate(
        context(Role.STUDENT, {
          applications: [],
          matches: [
            { title: 'Software Engineering Intern', company: 'Padu Analytics', score: 89, missingSkills: ['Docker'] },
          ],
          unverifiedSkills: [],
        }),
      );
      expect(reply).toContain('89');
      expect(reply).toContain('Software Engineering Intern');
      expect(reply).toContain('Docker');
    });

    it('flags unverified skills as the likely score-capping factor', async () => {
      const reply = await generator.generate(
        context(Role.STUDENT, { applications: [], matches: [], unverifiedSkills: ['PostgreSQL', 'Docker'] }),
      );
      expect(reply).toContain('PostgreSQL');
      expect(reply).toContain('Docker');
    });
  });

  describe('UNIVERSITY', () => {
    it('says a cohort has not loaded yet rather than fabricating stats, when there is no stats object', async () => {
      const reply = await generator.generate(context(Role.UNIVERSITY, {}));
      expect(reply.toLowerCase()).toContain("don't have a cohort");
    });

    it('cites the real placement rate and partner/event counts', async () => {
      const reply = await generator.generate(
        context(Role.UNIVERSITY, {
          stats: { placementRatePct: 13, studentsPlacedYtd: 3, activePartners: 5, upcomingEvents: 2 },
          topCompanies: [{ name: 'Padu Analytics', hires: 2 }],
          recentActivity: [],
        }),
      );
      expect(reply).toContain('13%');
      expect(reply).toContain('Padu Analytics');
      expect(reply).toContain('5');
    });
  });
});
