/**
 * InternSage — Development seed script
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-SEED-001
 * File   : prisma/seed.ts
 *
 * Run via `npx prisma db seed` (wired in package.json). Inserts
 * exactly enough reference data to exercise BOTH branches of the
 * domain-verification logic locally:
 *   - registering as a student @graduate.utm.my  -> verified: true
 *   - registering as a student @gmail.com        -> verified: false
 *   - registering as a recruiter @paduanalytics.com -> verified: true
 *   - registering as a recruiter @unknown-co.com  -> rejected outright
 *
 * `upsert` throughout so this is safe to re-run without creating
 * duplicates.
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const utm = await prisma.university.upsert({
    where: { emailDomain: 'graduate.utm.my' },
    update: {},
    create: {
      name: 'Universiti Teknologi Malaysia',
      emailDomain: 'graduate.utm.my',
      verified: true,
    },
  });

  const paduAnalytics = await prisma.company.upsert({
    where: { emailDomain: 'paduanalytics.com' },
    update: {},
    create: {
      name: 'Padu Analytics',
      emailDomain: 'paduanalytics.com',
      verified: true,
    },
  });

  // A default rubric for Padu Analytics — MatchingService falls
  // back to hardcoded defaults for any company without a row here,
  // this just demonstrates a company actually overriding them.
  await prisma.recruiterWeights.upsert({
    where: { companyId: paduAnalytics.id },
    update: {},
    create: {
      companyId: paduAnalytics.id,
      skillsWeight: 0.5,
      projectsWeight: 0.2,
      authenticityWeight: 0.25,
      softSkillsWeight: 0.05,
    },
  });

  // A minimal seeded question bank — enough to actually exercise
  // VerificationService end-to-end for one skill. Original
  // questions, per the Blueprint's "never scrape a proprietary
  // bank" rule. Add more via this same upsert pattern per skill as
  // the platform grows; five is the minimum StartSession needs to
  // hand out a full session.
  const jsSkill = await prisma.skill.upsert({
    where: { name: 'JavaScript' },
    update: {},
    create: { name: 'JavaScript', category: 'SOFTWARE' },
  });

  const jsQuestions: Array<{ prompt: string; choices: string[]; correctIndex: number }> = [
    {
      prompt: 'What does `typeof []` return in JavaScript?',
      choices: ['"array"', '"object"', '"list"', '"undefined"'],
      correctIndex: 1,
    },
    {
      prompt: 'Which keyword declares a block-scoped variable that can be reassigned?',
      choices: ['const', 'let', 'var', 'static'],
      correctIndex: 1,
    },
    {
      prompt: 'What does `Array.prototype.map` return?',
      choices: [
        'The original array, mutated in place',
        'A new array with the results of calling a function on every element',
        'A single accumulated value',
        'undefined',
      ],
      correctIndex: 1,
    },
    {
      prompt: 'What is the result of `"5" + 3` in JavaScript?',
      choices: ['8', '"53"', 'NaN', 'Error'],
      correctIndex: 1,
    },
    {
      prompt: 'Which of these correctly checks for strict equality?',
      choices: ['==', '===', '=', 'equals()'],
      correctIndex: 1,
    },
    {
      prompt: 'What does `async`/`await` help avoid?',
      choices: ['Type errors', 'Deeply nested Promise callbacks', 'Memory leaks', 'CSS specificity conflicts'],
      correctIndex: 1,
    },
  ];

  for (const q of jsQuestions) {
    const existing = await prisma.verificationQuestion.findFirst({
      where: { skillId: jsSkill.id, prompt: q.prompt },
    });
    if (!existing) {
      await prisma.verificationQuestion.create({
        data: { skillId: jsSkill.id, prompt: q.prompt, choices: q.choices, correctIndex: q.correctIndex },
      });
    }
  }

  // A few more Skill rows so Copilot/Matching have something to
  // demo beyond one skill — no question bank needed for these yet,
  // that's an incremental "add more later" task, not a blocker.
  const reactSkill = await prisma.skill.upsert({
    where: { name: 'React' },
    update: {},
    create: { name: 'React', category: 'SOFTWARE' },
  });
  const nodeSkill = await prisma.skill.upsert({
    where: { name: 'Node.js' },
    update: {},
    create: { name: 'Node.js', category: 'SOFTWARE' },
  });
  await prisma.skill.upsert({
    where: { name: 'PostgreSQL' },
    update: {},
    create: { name: 'PostgreSQL', category: 'SOFTWARE' },
  });

  // One sample posting so /jobs isn't empty on a fresh deploy.
  const dedupHash = createHash('sha256')
    .update(`software engineering intern::${paduAnalytics.id}::`)
    .digest('hex');
  const samplePosting = await prisma.jobPosting.upsert({
    where: { dedupHash },
    update: {},
    create: {
      companyId: paduAnalytics.id,
      title: 'Software Engineering Intern',
      description:
        'Join our platform team building the matching engine and recruiter tooling for a regional internship marketplace.',
      requirementsText: 'React, Node.js, and PostgreSQL experience preferred. Final-year students welcome.',
      category: 'SOFTWARE',
      dedupHash,
      requiredSkills: {
        create: [{ skillId: reactSkill.id }, { skillId: nodeSkill.id }, { skillId: jsSkill.id }],
      },
    },
  });

  // ---------------------------------------------------------------
  // Decision Room — salary benchmarks
  // ------------------------------------------------------------
  //  Author : Nahid Hasan Rayan
  //  Marker : NHR-BE-SEED-002
  //
  //  Sourced from Randstad Malaysia's 2025 Job Market Outlook &
  //  Salary Guide (the same report already cited as reference [3]
  //  in the URIIS paper) — junior/middle/senior monthly bands
  //  (MYR, basic salary, permanent role) re-used here as this
  //  table's p25/median/p75 columns. That's an honest approximation
  //  of the source's own bands, not a statistical percentile
  //  computed by InternSage — see the `source` field on every row,
  //  which the frontend doesn't currently render but exists for
  //  auditability, same principle as AuditLog elsewhere in this
  //  schema. NEVER add a row here without a real, dated, named
  //  source — see DecisionRoomService's header comment for why this
  //  table is curated rather than computed.
  // ---------------------------------------------------------------
  const salarySource = 'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide';
  const salaryAsOf = new Date('2024-12-19'); // report's own publish date
  const salaryBenchmarks: Array<{ role: string; region: string; p25: number; median: number; p75: number }> = [
    { role: 'Software Engineer', region: 'Malaysia', p25: 3_500, median: 10_000, p75: 17_000 },
    { role: 'Data Analyst', region: 'Malaysia', p25: 5_000, median: 10_000, p75: 17_000 },
    { role: 'Business Analyst', region: 'Malaysia', p25: 4_000, median: 6_500, p75: 9_000 },
    { role: 'UI/UX Designer', region: 'Malaysia', p25: 4_000, median: 13_000, p75: 25_000 },
    { role: 'DevOps Engineer', region: 'Malaysia', p25: 4_000, median: 8_000, p75: 12_000 },
    { role: 'Cloud Engineer', region: 'Malaysia', p25: 4_000, median: 6_000, p75: 9_000 },
    { role: 'Mechanical Engineer', region: 'Malaysia', p25: 5_000, median: 7_000, p75: 9_000 },
    { role: 'Account Executive', region: 'Malaysia', p25: 3_500, median: 4_500, p75: 5_500 },
  ];
  for (const row of salaryBenchmarks) {
    await prisma.salaryBenchmark.upsert({
      where: { role_region: { role: row.role, region: row.region } },
      update: { p25: row.p25, median: row.median, p75: row.p75, source: salarySource, asOf: salaryAsOf },
      create: { ...row, source: salarySource, asOf: salaryAsOf },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seeded:', {
    university: utm.name,
    company: paduAnalytics.name,
    verificationQuestions: jsQuestions.length,
    samplePosting: samplePosting.title,
    salaryBenchmarks: salaryBenchmarks.length,
  });
  // eslint-disable-next-line no-console
  console.log('\nTry registering with:');
  // eslint-disable-next-line no-console
  console.log('  STUDENT   nahid@graduate.utm.my   -> should come back verified: true');
  // eslint-disable-next-line no-console
  console.log('  STUDENT   someone@gmail.com       -> should come back verified: false (not rejected)');
  // eslint-disable-next-line no-console
  console.log('  RECRUITER hr@paduanalytics.com    -> should come back verified: true');
  // eslint-disable-next-line no-console
  console.log('  RECRUITER hr@some-random-co.com   -> should be REJECTED with a 400');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
