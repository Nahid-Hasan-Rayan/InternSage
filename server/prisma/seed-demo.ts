// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Demo account seed
 *
 * Separate from seed.ts's reference data on purpose: seed.ts seeds
 * what every environment needs to boot at all (universities,
 * companies, skills, the domain-verification test cases documented
 * in its own header). This file seeds four READY-TO-LOG-IN demo
 * accounts — one per role, including a platform ADMIN — with enough realistic depth (a real
 * cohort, real applications across every status, real computed
 * match scores, a real interview thread, a real Sage Copilot
 * conversation already in progress) that opening any of the four
 * immediately shows what the platform actually does, instead of an
 * empty state.
 *
 * Match scores here are NOT hand-typed numbers — computeMatchScore
 * below is the same weighted formula MatchingService.recomputeForStudent
 * uses (skill overlap + text similarity via embedText/cosineSimilarity +
 * authenticity + a neutral soft-skills placeholder), reused directly
 * so a demo score is never a fabricated statistic, just this
 * project's own real scoring function run against seeded rows. Same
 * "no fabricated statistics" rule the rest of this codebase already
 * holds itself to (see ways-of-working).
 *
 * Idempotent throughout (upsert / find-or-create), same as seed.ts —
 * safe to re-run against an already-seeded database. Writes run with
 * bounded concurrency (mapWithConcurrency, defined below) rather than
 * one-at-a-time — against a real pooled Supabase connection this was
 * the difference between a multi-minute seed and a much shorter one.
 * Status/score assignment is still computed deterministically before
 * any concurrent writes fire, so re-running this produces the same
 * results regardless of network timing.
 */

import { PrismaClient, ApplicationStatus, AnalyticsEventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { embedText, cosineSimilarity } from '../src/common/embeddings/embedding.util';

const BCRYPT_SALT_ROUNDS = 12;

/** One shared password across every demo account — this is publicly
 * documented (README, login page, console output), never a real
 * account's credential, so a single simple string is the right
 * choice, not a security smell. */
export const DEMO_PASSWORD = 'InternSageDemo!2026';

/** Bounded-concurrency map — the seed's ~300 Prisma round trips were taking 3-5 minutes
 * run fully sequentially (confirmed against a real Supabase Tokyo pooler). Independent
 * writes (different students, different skills on the same student, etc.) don't need to
 * wait on each other; this caps how many run at once so a small connection pool
 * (`connection_limit=1`, common in local `.env` setups) still doesn't get overwhelmed. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

interface DemoStudentSpec {
  email: string;
  fullName: string;
  major: string;
  year: number;
  headline: string;
  bio: string;
  skills: Array<{ name: string; verified: boolean; authenticityScore: number | null }>;
  experience?: { title: string; organization: string; startMonthsAgo: number; endMonthsAgo: number | null; description: string };
  project?: { title: string; description: string; portfolioUrl: string };
}

// Twenty students across MJIIT's actual programme spread (matches
// SKILL_CATALOG's field coverage) — enough for the recruiter demo's
// applicant pool, the university demo's cohort breakdown, and Sage
// Copilot to have something real to search across every role.
const DEMO_STUDENTS: DemoStudentSpec[] = [
  {
    email: 'demo.student@graduate.utm.my',
    fullName: 'Aisyah Rahman',
    major: 'Software Engineering',
    year: 3,
    headline: 'Software Engineering student focused on backend systems and developer tooling',
    bio: 'Third-year SE student at MJIIT. Building InternSage-adjacent side projects and chasing a platform-engineering internship.',
    skills: [
      { name: 'JavaScript', verified: true, authenticityScore: 88 },
      { name: 'React', verified: true, authenticityScore: 82 },
      { name: 'Node.js', verified: true, authenticityScore: 90 },
      { name: 'PostgreSQL', verified: false, authenticityScore: null },
      { name: 'Git', verified: true, authenticityScore: 95 },
      { name: 'Docker', verified: false, authenticityScore: null },
    ],
    experience: {
      title: 'Software Engineering Teaching Assistant',
      organization: 'MJIIT, UTM',
      startMonthsAgo: 8,
      endMonthsAgo: null,
      description: 'Hold weekly lab sessions for a first-year data structures course; graded 60+ students.',
    },
    project: {
      title: 'CampusEats — canteen queue predictor',
      description: 'A small Node.js/React app predicting canteen queue times from historical check-in data.',
      portfolioUrl: 'https://github.com/example/campus-eats',
    },
  },
  { email: 'chan.weijie@graduate.utm.my', fullName: 'Chan Wei Jie', major: 'Software Engineering', year: 4,
    headline: 'Final-year SE student, full-stack leaning frontend', bio: 'Building a portfolio around React and design systems.',
    skills: [
      { name: 'JavaScript', verified: true, authenticityScore: 91 },
      { name: 'React', verified: true, authenticityScore: 89 },
      { name: 'TypeScript', verified: true, authenticityScore: 84 },
      { name: 'Git', verified: true, authenticityScore: 92 },
    ] },
  { email: 'nur.izzati@graduate.utm.my', fullName: 'Nur Izzati Hassan', major: 'Software Engineering', year: 2,
    headline: 'Second-year SE student learning backend fundamentals', bio: 'New to internships, strong coursework record.',
    skills: [
      { name: 'Python', verified: false, authenticityScore: null },
      { name: 'SQL', verified: false, authenticityScore: null },
      { name: 'Git', verified: true, authenticityScore: 76 },
    ] },
  { email: 'muhd.hafiz@graduate.utm.my', fullName: 'Muhammad Hafiz Zulkifli', major: 'Software Engineering', year: 3,
    headline: 'Cloud-curious SE student', bio: 'Self-taught AWS, applying it to coursework projects.',
    skills: [
      { name: 'AWS', verified: true, authenticityScore: 79 },
      { name: 'Docker', verified: true, authenticityScore: 81 },
      { name: 'Node.js', verified: false, authenticityScore: null },
      { name: 'PostgreSQL', verified: true, authenticityScore: 85 },
    ] },
  { email: 'lim.sze.wei@graduate.utm.my', fullName: 'Lim Sze Wei', major: 'Data Science', year: 3,
    headline: 'Data Science student, ML-leaning', bio: 'Kaggle competitor, into applied statistics.',
    skills: [
      { name: 'Python', verified: true, authenticityScore: 93 },
      { name: 'SQL', verified: true, authenticityScore: 87 },
      { name: 'Statistical Analysis', verified: true, authenticityScore: 90 },
      { name: 'R', verified: false, authenticityScore: null },
    ] },
  { email: 'farah.aina@graduate.utm.my', fullName: 'Farah Aina Zulkarnain', major: 'Data Science', year: 4,
    headline: 'Final-year Data Science student', bio: 'Thesis on demand forecasting; open to data analyst roles.',
    skills: [
      { name: 'Python', verified: true, authenticityScore: 88 },
      { name: 'Data Visualization', verified: true, authenticityScore: 80 },
      { name: 'Econometrics', verified: false, authenticityScore: null },
      { name: 'SQL', verified: true, authenticityScore: 84 },
    ] },
  { email: 'tan.jun.hao@graduate.utm.my', fullName: 'Tan Jun Hao', major: 'Data Science', year: 2,
    headline: 'Second-year Data Science student', bio: 'Strong in R, exploring Python.',
    skills: [
      { name: 'R', verified: true, authenticityScore: 77 },
      { name: 'Statistical Analysis', verified: false, authenticityScore: null },
    ] },
  { email: 'siti.khadijah@graduate.utm.my', fullName: 'Siti Khadijah Yusof', major: 'Mechanical Engineering', year: 3,
    headline: 'Mechanical Engineering student, design-focused', bio: 'CAD-heavy coursework, into automotive design.',
    skills: [
      { name: 'AutoCAD', verified: true, authenticityScore: 86 },
      { name: 'SolidWorks', verified: true, authenticityScore: 83 },
      { name: 'Finite Element Analysis', verified: false, authenticityScore: null },
    ] },
  { email: 'amir.haziq@graduate.utm.my', fullName: 'Amir Haziq Rosli', major: 'Mechanical Engineering', year: 4,
    headline: 'Final-year Mechanical Engineering student', bio: 'FYP on thermal systems; applying to manufacturing programmes.',
    skills: [
      { name: 'ANSYS', verified: true, authenticityScore: 81 },
      { name: 'Thermodynamics', verified: true, authenticityScore: 89 },
      { name: 'CNC Machining', verified: false, authenticityScore: null },
    ] },
  { email: 'nurul.ain@graduate.utm.my', fullName: 'Nurul Ain Baharudin', major: 'Mechanical Engineering', year: 2,
    headline: 'Second-year Mechanical Engineering student', bio: 'Early-stage, exploring specialisations.',
    skills: [{ name: 'AutoCAD', verified: false, authenticityScore: null }] },
  { email: 'goh.jia.xin@graduate.utm.my', fullName: 'Goh Jia Xin', major: 'Electrical Engineering', year: 3,
    headline: 'Electrical Engineering student, embedded systems focus', bio: 'Building small embedded projects on the side.',
    skills: [
      { name: 'Embedded Systems', verified: true, authenticityScore: 85 },
      { name: 'PCB Design', verified: true, authenticityScore: 78 },
      { name: 'MATLAB', verified: false, authenticityScore: null },
    ] },
  { email: 'faris.iskandar@graduate.utm.my', fullName: 'Faris Iskandar Rahim', major: 'Electrical Engineering', year: 4,
    headline: 'Final-year Electrical Engineering student', bio: 'FYP on power systems reliability.',
    skills: [
      { name: 'Power Systems Analysis', verified: true, authenticityScore: 88 },
      { name: 'Circuit Design', verified: true, authenticityScore: 82 },
    ] },
  { email: 'wong.mei.ling@graduate.utm.my', fullName: 'Wong Mei Ling', major: 'Business Analytics', year: 3,
    headline: 'Business Analytics student', bio: 'Case-competition regular, into digital marketing analytics.',
    skills: [
      { name: 'Excel', verified: true, authenticityScore: 84 },
      { name: 'Business Analysis', verified: true, authenticityScore: 79 },
      { name: 'Digital Marketing', verified: false, authenticityScore: null },
    ] },
  { email: 'rania.zahra@graduate.utm.my', fullName: 'Rania Zahra Malik', major: 'Business Analytics', year: 2,
    headline: 'Second-year Business Analytics student', bio: 'Learning SQL alongside coursework.',
    skills: [
      { name: 'Excel', verified: false, authenticityScore: null },
      { name: 'SQL', verified: false, authenticityScore: null },
    ] },
  { email: 'daniel.tan@graduate.utm.my', fullName: 'Daniel Tan Kok Wei', major: 'Business Analytics', year: 4,
    headline: 'Final-year Business Analytics student', bio: 'Supply chain FYP, applying to operations analyst roles.',
    skills: [
      { name: 'Supply Chain Management', verified: true, authenticityScore: 80 },
      { name: 'Project Management', verified: true, authenticityScore: 83 },
      { name: 'Excel', verified: true, authenticityScore: 87 },
    ] },
  { email: 'nabila.hasyimi@graduate.utm.my', fullName: 'Nabila Hasyimi Roslan', major: 'Software Engineering', year: 4,
    headline: 'Final-year SE student, backend + databases', bio: 'Interested in platform and infra roles.',
    skills: [
      { name: 'Node.js', verified: true, authenticityScore: 86 },
      { name: 'PostgreSQL', verified: true, authenticityScore: 88 },
      { name: 'Docker', verified: true, authenticityScore: 75 },
      { name: 'AWS', verified: false, authenticityScore: null },
    ] },
  { email: 'aiman.syafiq@graduate.utm.my', fullName: 'Aiman Syafiq Kamal', major: 'Software Engineering', year: 1,
    headline: 'First-year SE student', bio: 'Just started, keen on frontend work.',
    skills: [{ name: 'JavaScript', verified: false, authenticityScore: null }] },
  { email: 'priya.subramaniam@graduate.utm.my', fullName: 'Priya Subramaniam', major: 'Data Science', year: 3,
    headline: 'Data Science student, visualization-focused', bio: 'Enjoys turning messy data into clear dashboards.',
    skills: [
      { name: 'Python', verified: true, authenticityScore: 85 },
      { name: 'Data Visualization', verified: true, authenticityScore: 91 },
      { name: 'SQL', verified: false, authenticityScore: null },
    ] },
  { email: 'yusof.rahim@graduate.utm.my', fullName: 'Yusof Rahim Adnan', major: 'Mechanical Engineering', year: 3,
    headline: 'Mechanical Engineering student, process-leaning', bio: 'Exploring chemical process crossover projects.',
    skills: [
      { name: 'SolidWorks', verified: false, authenticityScore: null },
      { name: 'Process Simulation', verified: false, authenticityScore: null },
    ] },
  { email: 'huda.mariam@graduate.utm.my', fullName: 'Huda Mariam Aziz', major: 'Business Analytics', year: 3,
    headline: 'Business Analytics student', bio: 'Interested in HR analytics and people operations.',
    skills: [
      { name: 'Excel', verified: true, authenticityScore: 82 },
      { name: 'Statistical Analysis', verified: false, authenticityScore: null },
    ] },
];

interface DemoPostingSpec {
  title: string;
  description: string;
  requirementsText: string;
  location: string;
  category: 'SOFTWARE' | 'BUSINESS';
  skillNames: string[];
}

const DEMO_PADU_POSTINGS: DemoPostingSpec[] = [
  {
    title: 'Data Analyst Intern',
    description: 'Support Padu Analytics\u2019 client reporting team with dashboards and ad-hoc analysis for regional clients.',
    requirementsText: 'SQL and Python comfort. Data visualization experience a plus. Open to Year 2+.',
    location: 'Kuala Lumpur, Malaysia',
    category: 'SOFTWARE',
    skillNames: ['SQL', 'Python', 'Data Visualization'],
  },
  {
    title: 'Backend Engineer Intern',
    description: 'Work on Padu Analytics\u2019 internal services team building the APIs powering client dashboards.',
    requirementsText: 'Node.js and PostgreSQL. Docker/AWS exposure valued. Final-year students preferred.',
    location: 'Kuala Lumpur, Malaysia',
    category: 'SOFTWARE',
    skillNames: ['Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    title: 'Business Analytics Intern',
    description: 'Join Padu Analytics\u2019 strategy team translating client data into decision-ready recommendations.',
    requirementsText: 'Excel fluency and a business/analytics major. SQL a plus.',
    location: 'Kuala Lumpur, Malaysia',
    category: 'BUSINESS',
    skillNames: ['Excel', 'Business Analysis'],
  },
];

/** Same weighted formula as MatchingService.recomputeForStudent, reused rather than
 * re-derived so a demo match score is a real computation, never a typed-in number. */
function computeMatchScore(
  skillNames: Set<string>,
  authenticityAvg: number,
  cvText: string,
  posting: { title: string; requirementsText: string; requiredSkillNames: string[] },
  weights: { skillsWeight: number; projectsWeight: number; authenticityWeight: number; softSkillsWeight: number },
): { score: number; matchedSkills: string[]; missingSkills: string[] } {
  const requiredNames = posting.requiredSkillNames.map((n) => n.toLowerCase());
  const matchedSkills = requiredNames.filter((name) => skillNames.has(name));
  const missingSkills = requiredNames.filter((name) => !skillNames.has(name));
  const skillOverlapRatio = requiredNames.length > 0 ? matchedSkills.length / requiredNames.length : 0;

  const textSimilarity = cosineSimilarity(embedText(cvText), embedText(`${posting.title} ${posting.requirementsText}`));
  const normalizedTextSimilarity = (textSimilarity + 1) / 2;

  const rawScore =
    weights.skillsWeight * skillOverlapRatio +
    weights.projectsWeight * normalizedTextSimilarity +
    weights.authenticityWeight * (authenticityAvg / 100) +
    weights.softSkillsWeight * 0.5;

  return {
    score: Math.round(Math.max(0, Math.min(1, rawScore)) * 100),
    matchedSkills,
    missingSkills,
  };
}

export async function seedDemoAccounts(prisma: PrismaClient): Promise<void> {
  const utm = await prisma.university.findUniqueOrThrow({ where: { emailDomain: 'graduate.utm.my' } });
  const paduAnalytics = await prisma.company.findUniqueOrThrow({ where: { emailDomain: 'paduanalytics.com' } });
  const weights = await prisma.recruiterWeights.findUnique({ where: { companyId: paduAnalytics.id } });
  const weightsResolved = {
    skillsWeight: weights?.skillsWeight ?? 0.4,
    projectsWeight: weights?.projectsWeight ?? 0.2,
    authenticityWeight: weights?.authenticityWeight ?? 0.3,
    softSkillsWeight: weights?.softSkillsWeight ?? 0.1,
  };
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);

  // ---------------------------------------------------------------
  // Extra Padu Analytics postings, so the recruiter demo account has
  // more than the one sample posting from seed.ts to source from.
  // ---------------------------------------------------------------
  const existingPosting = await prisma.jobPosting.findFirst({
    where: { companyId: paduAnalytics.id, title: 'Software Engineering Intern' },
  });

  for (const spec of DEMO_PADU_POSTINGS) {
    const dedupHash = createHash('sha256').update(`${spec.title.toLowerCase()}::${paduAnalytics.id}::`).digest('hex');
    const skillRows = await prisma.skill.findMany({ where: { name: { in: spec.skillNames } } });
    await prisma.jobPosting.upsert({
      where: { dedupHash },
      update: {},
      create: {
        companyId: paduAnalytics.id,
        title: spec.title,
        description: spec.description,
        requirementsText: spec.requirementsText,
        location: spec.location,
        category: spec.category,
        dedupHash,
        requiredSkills: { create: skillRows.map((s) => ({ skillId: s.id })) },
      },
    });
  }
  void existingPosting; // kept only to document that seed.ts's original posting is expected to already exist

  const allPaduPostings = await prisma.jobPosting.findMany({
    where: { companyId: paduAnalytics.id },
    include: { requiredSkills: { include: { skill: true } } },
  });

  // ---------------------------------------------------------------
  // Demo recruiter — Padu Analytics
  // ---------------------------------------------------------------
  const recruiterUser = await prisma.user.upsert({
    where: { email: 'demo.recruiter@paduanalytics.com' },
    update: {},
    create: {
      email: 'demo.recruiter@paduanalytics.com',
      fullName: 'Marcus Tan (Talent Lead, Padu Analytics)',
      passwordHash,
      role: 'RECRUITER',
      verified: true,
    },
  });
  await prisma.recruiterProfile.upsert({
    where: { userId: recruiterUser.id },
    update: {},
    create: { userId: recruiterUser.id, companyId: paduAnalytics.id },
  });

  // ---------------------------------------------------------------
  // Demo university admin — UTM
  // ---------------------------------------------------------------
  const universityAdminUser = await prisma.user.upsert({
    where: { email: 'demo.university@graduate.utm.my' },
    update: {},
    create: {
      email: 'demo.university@graduate.utm.my',
      fullName: 'Dr. Farhana Ismail (Career Centre Director, UTM)',
      passwordHash,
      role: 'UNIVERSITY',
      verified: true,
    },
  });
  await prisma.universityAdminProfile.upsert({
    where: { userId: universityAdminUser.id },
    update: {},
    create: { userId: universityAdminUser.id, universityId: utm.id },
  });

  const partners: Array<{ name: string; industry: string }> = [
    { name: 'Padu Analytics', industry: 'Data & Analytics' },
    { name: 'Grab Malaysia', industry: 'Technology' },
    { name: 'Maxis Berhad', industry: 'Telecommunications' },
    { name: 'PETRONAS', industry: 'Energy' },
    { name: 'Huawei Technologies (Malaysia)', industry: 'Technology' },
  ];
  for (const partner of partners) {
    const existing = await prisma.universityPartner.findFirst({ where: { universityId: utm.id, name: partner.name } });
    if (!existing) {
      await prisma.universityPartner.create({ data: { universityId: utm.id, name: partner.name, industry: partner.industry } });
    }
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const events: Array<{ title: string; offsetDays: number }> = [
    { title: 'MJIIT Career Fair 2026', offsetDays: -18 },
    { title: 'Resume & LinkedIn Clinic', offsetDays: -6 },
    { title: 'Tech Talk: Careers in Applied AI', offsetDays: 14 },
    { title: 'Alumni Networking Night', offsetDays: 35 },
  ];
  for (const event of events) {
    const existing = await prisma.universityEvent.findFirst({ where: { universityId: utm.id, title: event.title } });
    if (!existing) {
      await prisma.universityEvent.create({
        data: { universityId: utm.id, title: event.title, date: new Date(now + event.offsetDays * DAY) },
      });
    }
  }

  // ---------------------------------------------------------------
  // Demo students — the cohort
  // ---------------------------------------------------------------
  // Fetch every skill's id once instead of one findUnique per skill per student — with an
  // average of ~4 skills across 20 students, that alone was ~80 round trips down to 1.
  const skillIdByName = new Map((await prisma.skill.findMany({ select: { id: true, name: true } })).map((s) => [s.name, s.id]));

  const studentUserIds = await mapWithConcurrency(DEMO_STUDENTS, 5, async (spec) => {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: { email: spec.email, fullName: spec.fullName, passwordHash, role: 'STUDENT', verified: true },
    });

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, universityId: utm.id, major: spec.major, year: spec.year, bio: spec.bio },
    });

    const professionalProfile = await prisma.professionalProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, headline: spec.headline },
    });

    // Skills, education, experience, and project all depend only on professionalProfile.id,
    // not on each other — safe to fire together instead of one-at-a-time.
    await Promise.all([
      ...spec.skills.map(async (skillSpec) => {
        const skillId = skillIdByName.get(skillSpec.name);
        if (!skillId) return;
        await prisma.userSkill.upsert({
          where: { professionalProfileId_skillId: { professionalProfileId: professionalProfile.id, skillId } },
          update: {},
          create: {
            professionalProfileId: professionalProfile.id,
            skillId,
            verified: skillSpec.verified,
            authenticityScore: skillSpec.authenticityScore,
            authenticityUpdatedAt: skillSpec.verified ? new Date() : null,
          },
        });
      }),
      (async () => {
        const existingEducation = await prisma.education.findFirst({ where: { professionalProfileId: professionalProfile.id } });
        if (!existingEducation) {
          await prisma.education.create({
            data: {
              professionalProfileId: professionalProfile.id,
              institution: 'Universiti Teknologi Malaysia (MJIIT)',
              degree: `B.${spec.major}`,
              startYear: new Date().getFullYear() - spec.year,
              verified: true,
            },
          });
        }
      })(),
      (async () => {
        if (!spec.experience) return;
        const existingExperience = await prisma.experience.findFirst({
          where: { professionalProfileId: professionalProfile.id, title: spec.experience.title },
        });
        if (!existingExperience) {
          await prisma.experience.create({
            data: {
              professionalProfileId: professionalProfile.id,
              title: spec.experience.title,
              organization: spec.experience.organization,
              startDate: new Date(now - spec.experience.startMonthsAgo * 30 * DAY),
              endDate: spec.experience.endMonthsAgo ? new Date(now - spec.experience.endMonthsAgo * 30 * DAY) : null,
              description: spec.experience.description,
            },
          });
        }
      })(),
      (async () => {
        if (!spec.project) return;
        const existingProject = await prisma.project.findFirst({
          where: { professionalProfileId: professionalProfile.id, title: spec.project.title },
        });
        if (!existingProject) {
          await prisma.project.create({
            data: {
              professionalProfileId: professionalProfile.id,
              title: spec.project.title,
              description: spec.project.description,
              portfolioUrl: spec.project.portfolioUrl,
            },
          });
        }
      })(),
    ]);

    return user.id;
  });

  // ---------------------------------------------------------------
  // Applications — most of the cohort applies to 1-3 Padu Analytics
  // postings, status distribution weighted toward early stages (the
  // way a real pipeline actually looks), a handful of OFFERs so the
  // university demo's placement rate isn't a flat zero.
  // ---------------------------------------------------------------
  const STATUS_CYCLE: ApplicationStatus[] = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.APPLIED,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.APPLIED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.INTERVIEW,
  ];

  let cycleIndex = 0;
  const applicationPlans: Array<{ userId: string; jobPostingId: string; status: ApplicationStatus }> = [];
  const applyingUserIds: string[] = [];

  // Status-cycle assignment is pure computation (no DB calls) so it stays fully
  // deterministic regardless of write order below — only the writes themselves parallelize.
  for (let i = 0; i < studentUserIds.length; i += 1) {
    // Every 4th student skips applying — an honest "hasn't started yet" slice of the cohort,
    // same reasoning as the rest of this file's "never fabricate a uniform 100%" stance.
    if (i % 4 === 3) continue;
    const userId = studentUserIds[i];
    applyingUserIds.push(userId);
    const postingCount = (i % 3) + 1; // 1-3 postings per applying student
    for (let p = 0; p < postingCount && p < allPaduPostings.length; p += 1) {
      const posting = allPaduPostings[(i + p) % allPaduPostings.length];
      const status = STATUS_CYCLE[cycleIndex % STATUS_CYCLE.length];
      cycleIndex += 1;
      applicationPlans.push({ userId, jobPostingId: posting.id, status });
    }
  }

  const writtenApplications = await mapWithConcurrency(applicationPlans, 8, async (plan) => {
    const application = await prisma.application.upsert({
      where: { userId_jobPostingId: { userId: plan.userId, jobPostingId: plan.jobPostingId } },
      update: { status: plan.status },
      create: plan,
    });
    return { userId: plan.userId, id: application.id, jobPostingId: plan.jobPostingId, status: application.status };
  });

  const applicationsByStudent = new Map<string, Array<{ id: string; jobPostingId: string; status: ApplicationStatus }>>();
  for (const userId of applyingUserIds) applicationsByStudent.set(userId, []);
  for (const written of writtenApplications) {
    applicationsByStudent.get(written.userId)?.push({ id: written.id, jobPostingId: written.jobPostingId, status: written.status });
  }

  // ---------------------------------------------------------------
  // Match scores — real computation (see computeMatchScore above),
  // one per applying student against every Padu Analytics posting so
  // Sage's student-mode answers and /matches both have real rows.
  // ---------------------------------------------------------------
  // Bulk-fetch both profile tables in two queries instead of two findUnique calls PER
  // applying student — with ~15 applicants that was ~30 round trips down to 2.
  const [applyingStudentProfiles, applyingProfessionalProfiles] = await Promise.all([
    prisma.studentProfile.findMany({ where: { userId: { in: applyingUserIds } } }),
    prisma.professionalProfile.findMany({
      where: { userId: { in: applyingUserIds } },
      include: { skills: { include: { skill: true } }, experiences: true, projects: true },
    }),
  ]);
  const studentProfileByUserId = new Map(applyingStudentProfiles.map((sp) => [sp.userId, sp]));
  const professionalProfileByUserId = new Map(applyingProfessionalProfiles.map((pp) => [pp.userId, pp]));

  const matchScorePlans: Array<{ studentProfileId: string; jobPostingId: string; score: number; matchedSkills: string[]; missingSkills: string[] }> = [];
  for (const userId of applicationsByStudent.keys()) {
    const studentProfile = studentProfileByUserId.get(userId);
    const professionalProfile = professionalProfileByUserId.get(userId);
    if (!studentProfile || !professionalProfile) continue;

    const skillNameSet = new Set(professionalProfile.skills.map((s) => s.skill.name.toLowerCase()));
    const authenticityScores = professionalProfile.skills
      .map((s) => s.authenticityScore)
      .filter((v): v is number => typeof v === 'number');
    const authenticityAvg =
      authenticityScores.length > 0 ? authenticityScores.reduce((sum, v) => sum + v, 0) / authenticityScores.length : 0;
    const cvText = [
      ...professionalProfile.skills.map((s) => s.skill.name),
      ...professionalProfile.experiences.map((e) => `${e.title} ${e.description ?? ''}`),
      ...professionalProfile.projects.map((p) => `${p.title} ${p.description ?? ''}`),
      professionalProfile.headline ?? '',
    ].join(' ');

    for (const posting of allPaduPostings) {
      const { score, matchedSkills, missingSkills } = computeMatchScore(
        skillNameSet,
        authenticityAvg,
        cvText,
        { title: posting.title, requirementsText: posting.requirementsText, requiredSkillNames: posting.requiredSkills.map((r) => r.skill.name) },
        weightsResolved,
      );
      matchScorePlans.push({ studentProfileId: studentProfile.id, jobPostingId: posting.id, score, matchedSkills, missingSkills });
    }
  }

  await mapWithConcurrency(matchScorePlans, 8, (plan) =>
    prisma.matchScore.upsert({
      where: { studentProfileId_jobPostingId: { studentProfileId: plan.studentProfileId, jobPostingId: plan.jobPostingId } },
      update: { score: plan.score, matchedSkills: plan.matchedSkills, missingSkills: plan.missingSkills, computedAt: new Date() },
      create: plan,
    }),
  );

  // ---------------------------------------------------------------
  // Interview kit + scorecard + a real message thread, on the flagship
  // demo student's INTERVIEW-status application if one exists.
  // ---------------------------------------------------------------
  const flagshipStudentUser = await prisma.user.findUnique({ where: { email: 'demo.student@graduate.utm.my' } });
  if (flagshipStudentUser) {
    const flagshipApplications = applicationsByStudent.get(flagshipStudentUser.id) ?? [];
    const interviewApp = flagshipApplications.find((a) => a.status === 'INTERVIEW') ?? flagshipApplications[0];
    if (interviewApp) {
      const posting = allPaduPostings.find((p) => p.id === interviewApp.jobPostingId);
      if (posting) {
        const kit = await prisma.interviewKit.upsert({
          where: { companyId_roleTitle: { companyId: paduAnalytics.id, roleTitle: posting.title } },
          update: {},
          create: {
            companyId: paduAnalytics.id,
            roleTitle: posting.title,
            criteria: [
              { label: 'Technical fundamentals', description: 'Can reason about the core stack this role actually uses.' },
              { label: 'Problem solving', description: 'Breaks an ambiguous problem into a concrete plan.' },
              { label: 'Communication', description: 'Explains technical decisions clearly to a non-specialist.' },
            ],
          },
        });

        const existingScorecard = await prisma.scorecard.findFirst({ where: { applicationId: interviewApp.id } });
        if (!existingScorecard) {
          await prisma.scorecard.create({
            data: {
              applicationId: interviewApp.id,
              interviewKitId: kit.id,
              submittedById: recruiterUser.id,
              ratings: { 'Technical fundamentals': 4, 'Problem solving': 4, Communication: 5 },
              notes: 'Strong communicator, solid fundamentals. Would like a follow-up on system design depth.',
              recommendation: 'YES',
            },
          });
        }

        const conversation = await prisma.conversation.upsert({
          where: { applicationId: interviewApp.id },
          update: {},
          create: { applicationId: interviewApp.id },
        });
        const existingMessages = await prisma.message.count({ where: { conversationId: conversation.id } });
        if (existingMessages === 0) {
          await prisma.message.createMany({
            data: [
              {
                conversationId: conversation.id,
                senderUserId: recruiterUser.id,
                body: `Hi Aisyah, thanks for applying to ${posting.title}. Your CampusEats project stood out — do you have 20 minutes this week for a quick call?`,
                createdAt: new Date(now - 3 * DAY),
              },
              {
                conversationId: conversation.id,
                senderUserId: flagshipStudentUser.id,
                body: 'Hi Marcus, thank you! I\u2019m free Thursday afternoon or Friday morning, whichever works better for you.',
                createdAt: new Date(now - 3 * DAY + 2 * 60 * 60 * 1000),
              },
              {
                conversationId: conversation.id,
                senderUserId: recruiterUser.id,
                body: 'Friday 10am works. I\u2019ll send a calendar invite — looking forward to it.',
                createdAt: new Date(now - 2 * DAY),
              },
            ],
          });
        }
      }
    }

    // A pre-populated Sage Copilot thread, so opening the demo account
    // shows conversation memory already working, not an empty box.
    const existingConversation = await prisma.copilotConversation.findFirst({ where: { userId: flagshipStudentUser.id } });
    if (!existingConversation) {
      const conversation = await prisma.copilotConversation.create({
        data: { userId: flagshipStudentUser.id, title: 'How am I doing so far?' },
      });
      await prisma.copilotMessage.createMany({
        data: [
          { conversationId: conversation.id, sender: 'USER', content: 'How am I doing so far?' },
          {
            conversationId: conversation.id,
            sender: 'SAGE',
            content:
              'Solid momentum \u2014 you\u2019ve got applications moving across Padu Analytics\u2019 pipeline, including one at the interview stage. ' +
              'Your JavaScript, React, Node.js, and Git are verified, which is doing real work for your match scores. PostgreSQL and Docker ' +
              'are still unverified on your CV \u2014 run verification on those next, that\u2019s usually the single biggest lever left on your score.',
          },
        ],
      });
    }
  }

  // ---------------------------------------------------------------
  // Demo platform admin — the only role that can never self-register
  // (see RegisterDto — ADMIN is deliberately excluded from the
  // allowed-roles enum), so this seed is the only way one exists.
  // ---------------------------------------------------------------
  const adminUser = await prisma.user.upsert({
    where: { email: 'demo.admin@internsage.app' },
    update: {},
    create: {
      email: 'demo.admin@internsage.app',
      fullName: 'Reza Aliff (Platform Operations, InternSage)',
      passwordHash,
      role: 'ADMIN',
      verified: true,
    },
  });

  // AnalyticsEvent/ErrorLog rows only come from real HTTP traffic
  // (RequestLoggingInterceptor / AllExceptionsFilter) — nothing else
  // in this file writes to either table. Without at least a sample
  // batch, the admin demo account's whole reason for existing (the
  // /admin/analytics dashboard) opens to an empty state. Guarded on
  // an empty table so this never fires against a database that
  // already has real telemetry — an environment with actual traffic
  // should never have synthetic rows mixed into it.
  const existingTelemetry = await prisma.analyticsEvent.count();
  if (existingTelemetry === 0) {
    const telemetryActors = [
      recruiterUser.id,
      universityAdminUser.id,
      adminUser.id,
      ...studentUserIds.slice(0, 6),
    ];
    const routes: Array<{ path: string; method: string; statusRange: [number, number]; durationRange: [number, number] }> = [
      { path: '/health', method: 'GET', statusRange: [200, 200], durationRange: [20, 60] },
      { path: '/jobs', method: 'GET', statusRange: [200, 200], durationRange: [400, 1400] },
      { path: '/jobs/:id', method: 'GET', statusRange: [200, 200], durationRange: [300, 1100] },
      { path: '/matches', method: 'GET', statusRange: [200, 200], durationRange: [500, 1800] },
      { path: '/applications', method: 'GET', statusRange: [200, 200], durationRange: [300, 900] },
      { path: '/cv', method: 'GET', statusRange: [200, 200], durationRange: [400, 1200] },
      { path: '/copilot/query', method: 'POST', statusRange: [200, 200], durationRange: [1200, 9000] },
      { path: '/copilot/conversations', method: 'GET', statusRange: [200, 200], durationRange: [200, 600] },
      { path: '/university/dashboard', method: 'GET', statusRange: [200, 200], durationRange: [400, 1000] },
      { path: '/recruiter/weights', method: 'GET', statusRange: [200, 200], durationRange: [150, 400] },
      { path: '/verification/internal/decay', method: 'GET', statusRange: [200, 200], durationRange: [200, 900] },
    ];
    const eventRows: Array<{
      type: AnalyticsEventType;
      userId?: string;
      path?: string;
      method?: string;
      statusCode?: number;
      durationMs?: number;
      createdAt: Date;
    }> = [];

    // Deterministic pseudo-spread, not Math.random — reproducible across re-runs of an
    // already-empty table, same reasoning as everything else in this file.
    let seedCursor = 0;
    const next = (mod: number) => {
      seedCursor = (seedCursor * 1103515245 + 12345) & 0x7fffffff;
      return seedCursor % mod;
    };

    for (let day = 13; day >= 0; day -= 1) {
      const requestsToday = 15 + next(40);
      for (let i = 0; i < requestsToday; i += 1) {
        const route = routes[next(routes.length)];
        const actor = telemetryActors[next(telemetryActors.length)];
        const [minDur, maxDur] = route.durationRange;
        eventRows.push({
          type: 'REQUEST',
          userId: actor,
          path: route.path,
          method: route.method,
          statusCode: route.statusRange[0],
          durationMs: minDur + next(maxDur - minDur + 1),
          createdAt: new Date(now - day * DAY - next(20) * 60 * 60 * 1000),
        });
      }
    }

    for (const actorId of telemetryActors) {
      eventRows.push({ type: 'AUTH_REGISTER', userId: actorId, createdAt: new Date(now - 13 * DAY) });
      eventRows.push({ type: 'AUTH_LOGIN', userId: actorId, createdAt: new Date(now - next(13) * DAY) });
    }
    eventRows.push({ type: 'AUTH_LOGIN_FAILED', createdAt: new Date(now - 2 * DAY) });

    await prisma.analyticsEvent.createMany({ data: eventRows });

    await prisma.errorLog.createMany({
      data: [
        {
          message: 'ValidationError: question must be longer than or equal to 3 characters',
          path: '/copilot/query',
          method: 'POST',
          statusCode: 400,
          requestId: 'demo-seed-req-1',
          userId: studentUserIds[0],
          createdAt: new Date(now - 4 * DAY),
        },
        {
          message: 'OpenRouter request timed out after 10000ms',
          path: '/copilot/query',
          method: 'POST',
          statusCode: 502,
          requestId: 'demo-seed-req-2',
          userId: recruiterUser.id,
          createdAt: new Date(now - 1 * DAY),
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('\nDemo accounts seeded (password for all four: ' + DEMO_PASSWORD + '):');
  // eslint-disable-next-line no-console
  console.log('  STUDENT    demo.student@graduate.utm.my');
  // eslint-disable-next-line no-console
  console.log('  RECRUITER  demo.recruiter@paduanalytics.com');
  // eslint-disable-next-line no-console
  console.log('  UNIVERSITY demo.university@graduate.utm.my');
  // eslint-disable-next-line no-console
  console.log('  ADMIN      demo.admin@internsage.app');
  // eslint-disable-next-line no-console
  console.log(`  Cohort: ${DEMO_STUDENTS.length} students, ${allPaduPostings.length} Padu Analytics postings, ${applicationsByStudent.size} applicants.`);
}

// Allow `ts-node prisma/seed-demo.ts` standalone, in addition to being imported from seed.ts.
if (require.main === module) {
  const prisma = new PrismaClient();
  seedDemoAccounts(prisma)
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
