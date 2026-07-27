-- ============================================================
--  InternSage — Full database schema for Supabase
-- ------------------------------------------------------------
--  Author : Nahid Hasan Rayan
--  Marker : NHR-DB-SUPABASE-SQL-002
--  File   : server/supabase/schema.sql
--
--  Regenerated to match prisma/schema.prisma through Phase 2/3
--  (Jobs, JobAggregator, Matching, Verification, Applications).
--  Byte-for-byte match: every table/column/enum/index/FK here
--  corresponds directly to a model in that file. Use this if you'd
--  rather paste SQL into Supabase's SQL Editor than run
--  `npx prisma migrate deploy` from your own machine.
--
--  IMPORTANT — if you use this file:
--  After running it, tell Prisma the migration already happened
--  so it doesn't try to re-apply it later:
--
--    mkdir -p prisma/migrations/0_init
--    cp supabase/schema.sql prisma/migrations/0_init/migration.sql
--    npx prisma migrate resolve --applied 0_init
--
--  Run this whole file in one go: Supabase Dashboard → SQL Editor
--  → New query → paste → Run. Meant for a FRESH Supabase project —
--  don't run it against one that already has these tables.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;   -- Phase 2 target architecture (see MatchingService's header comment)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() for the seed inserts below

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

CREATE TYPE "Role" AS ENUM ('STUDENT', 'RECRUITER', 'ADMIN');
CREATE TYPE "ProfileVisibility" AS ENUM ('ALL_VERIFIED_RECRUITERS', 'APPLIED_ONLY', 'DRAFT');
CREATE TYPE "SkillCategory" AS ENUM (
  'SOFTWARE', 'MECHANICAL', 'ELECTRICAL', 'CHEMICAL',
  'BUSINESS', 'ACCOUNTING', 'ECONOMICS', 'OTHER'
);
CREATE TYPE "AnalyticsEventType" AS ENUM (
  'REQUEST', 'AUTH_REGISTER', 'AUTH_LOGIN', 'AUTH_LOGIN_FAILED',
  'PROFILE_UPDATED', 'CV_UPDATED', 'JOB_POSTING_CREATED',
  'MATCHES_RECOMPUTED', 'VERIFICATION_COMPLETED', 'APPLICATION_STATUS_CHANGED'
);
CREATE TYPE "JobSource" AS ENUM ('MANUAL', 'API', 'RSS', 'SCRAPED');
CREATE TYPE "VerificationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE "ApplicationStatus" AS ENUM (
  'APPLIED', 'UNDER_REVIEW', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'
);

-- ------------------------------------------------------------
-- Identity
-- ------------------------------------------------------------

CREATE TABLE "users" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "fullName"     TEXT NOT NULL,
  "role"         "Role" NOT NULL,
  "verified"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "universities" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "emailDomain" TEXT NOT NULL,
  "verified"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "universities_emailDomain_key" ON "universities"("emailDomain");

CREATE TABLE "companies" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "emailDomain" TEXT NOT NULL,
  "verified"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "companies_emailDomain_key" ON "companies"("emailDomain");

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------

CREATE TABLE "student_profiles" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "universityId" TEXT,
  "major"        TEXT,
  "year"         INTEGER,
  "bio"          TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");
CREATE INDEX "student_profiles_universityId_idx" ON "student_profiles"("universityId");

CREATE TABLE "professional_profiles" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "headline"   TEXT,
  "visibility" "ProfileVisibility" NOT NULL DEFAULT 'ALL_VERIFIED_RECRUITERS',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "professional_profiles_userId_key" ON "professional_profiles"("userId");

CREATE TABLE "recruiter_profiles" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recruiter_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recruiter_profiles_userId_key" ON "recruiter_profiles"("userId");
CREATE INDEX "recruiter_profiles_companyId_idx" ON "recruiter_profiles"("companyId");

-- ------------------------------------------------------------
-- Observability
-- ------------------------------------------------------------

CREATE TABLE "analytics_events" (
  "id"         TEXT NOT NULL,
  "type"       "AnalyticsEventType" NOT NULL,
  "userId"     TEXT,
  "userRole"   "Role",
  "path"       TEXT,
  "method"     TEXT,
  "statusCode" INTEGER,
  "durationMs" INTEGER,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "analytics_events_type_createdAt_idx" ON "analytics_events"("type", "createdAt");
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

CREATE TABLE "error_logs" (
  "id"         TEXT NOT NULL,
  "message"    TEXT NOT NULL,
  "stack"      TEXT,
  "path"       TEXT,
  "method"     TEXT,
  "statusCode" INTEGER NOT NULL,
  "requestId"  TEXT NOT NULL,
  "userId"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");
CREATE INDEX "error_logs_path_idx" ON "error_logs"("path");

-- ------------------------------------------------------------
-- Jobs, matching, applications, trust & verification
-- ------------------------------------------------------------

CREATE TABLE "job_postings" (
  "id"               TEXT NOT NULL,
  "companyId"        TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "description"      TEXT NOT NULL,
  "requirementsText" TEXT NOT NULL,
  "location"         TEXT,
  "category"         "SkillCategory",
  "source"           "JobSource" NOT NULL DEFAULT 'MANUAL',
  "externalUrl"      TEXT,
  "dedupHash"        TEXT NOT NULL,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "postedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "job_postings_dedupHash_key" ON "job_postings"("dedupHash");
CREATE INDEX "job_postings_companyId_idx" ON "job_postings"("companyId");

CREATE TABLE "job_required_skills" (
  "id"           TEXT NOT NULL,
  "jobPostingId" TEXT NOT NULL,
  "skillId"      TEXT NOT NULL,
  CONSTRAINT "job_required_skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "job_required_skills_jobPostingId_skillId_key" ON "job_required_skills"("jobPostingId", "skillId");

CREATE TABLE "applications" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "jobPostingId" TEXT NOT NULL,
  "status"       "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "applications_userId_jobPostingId_key" ON "applications"("userId", "jobPostingId");
CREATE INDEX "applications_userId_idx" ON "applications"("userId");
CREATE INDEX "applications_jobPostingId_idx" ON "applications"("jobPostingId");

CREATE TABLE "recruiter_weights" (
  "id"                 TEXT NOT NULL,
  "companyId"          TEXT NOT NULL,
  "skillsWeight"       DOUBLE PRECISION NOT NULL DEFAULT 0.4,
  "projectsWeight"     DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "authenticityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  "softSkillsWeight"   DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  CONSTRAINT "recruiter_weights_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recruiter_weights_companyId_key" ON "recruiter_weights"("companyId");

CREATE TABLE "match_scores" (
  "id"               TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "jobPostingId"     TEXT NOT NULL,
  "score"            INTEGER NOT NULL,
  "matchedSkills"    JSONB NOT NULL,
  "missingSkills"    JSONB NOT NULL,
  "computedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "match_scores_studentProfileId_jobPostingId_key" ON "match_scores"("studentProfileId", "jobPostingId");
CREATE INDEX "match_scores_studentProfileId_idx" ON "match_scores"("studentProfileId");

CREATE TABLE "verification_questions" (
  "id"           TEXT NOT NULL,
  "skillId"      TEXT NOT NULL,
  "prompt"       TEXT NOT NULL,
  "choices"      JSONB NOT NULL,
  "correctIndex" INTEGER NOT NULL,
  CONSTRAINT "verification_questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verification_questions_skillId_idx" ON "verification_questions"("skillId");

CREATE TABLE "verification_sessions" (
  "id"          TEXT NOT NULL,
  "userSkillId" TEXT NOT NULL,
  "questionIds" TEXT[] NOT NULL,
  "answers"     INTEGER[] NOT NULL,
  "status"      "VerificationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "score"       INTEGER,
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verification_sessions_userSkillId_idx" ON "verification_sessions"("userSkillId");

-- ------------------------------------------------------------
-- CV building blocks
-- ------------------------------------------------------------

CREATE TABLE "skills" (
  "id"       TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "category" "SkillCategory" NOT NULL DEFAULT 'OTHER',
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

CREATE TABLE "user_skills" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "skillId"               TEXT NOT NULL,
  "verified"              BOOLEAN NOT NULL DEFAULT false,
  "authenticityScore"     INTEGER,
  "authenticityUpdatedAt" TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_skills_professionalProfileId_skillId_key" ON "user_skills"("professionalProfileId", "skillId");

CREATE TABLE "experiences" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "organization"          TEXT NOT NULL,
  "startDate"             TIMESTAMP(3) NOT NULL,
  "endDate"               TIMESTAMP(3),
  "description"           TEXT,
  CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "experiences_professionalProfileId_idx" ON "experiences"("professionalProfileId");

CREATE TABLE "educations" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "institution"           TEXT NOT NULL,
  "degree"                TEXT NOT NULL,
  "startYear"             INTEGER NOT NULL,
  "endYear"               INTEGER,
  "verified"              BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "educations_professionalProfileId_idx" ON "educations"("professionalProfileId");

CREATE TABLE "projects" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "description"           TEXT,
  "portfolioUrl"          TEXT,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "projects_professionalProfileId_idx" ON "projects"("professionalProfileId");

-- ------------------------------------------------------------
-- Foreign keys (added last, after every table exists)
-- ------------------------------------------------------------

ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_required_skills" ADD CONSTRAINT "job_required_skills_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_required_skills" ADD CONSTRAINT "job_required_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verification_questions" ADD CONSTRAINT "verification_questions_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "user_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "educations" ADD CONSTRAINT "educations_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE: analytics_events.userId, error_logs.userId, and
-- applications.userId have NO foreign key to users on purpose —
-- matches schema.prisma exactly (Application has no `user` relation
-- field, only a raw userId column) so historical records are never
-- blocked by or cascaded from a user deletion.

-- ------------------------------------------------------------
-- Seed data (mirrors server/prisma/seed.ts)
-- ------------------------------------------------------------

INSERT INTO "universities" ("id", "name", "emailDomain", "verified", "createdAt")
VALUES (gen_random_uuid()::text, 'Universiti Teknologi Malaysia', 'graduate.utm.my', true, CURRENT_TIMESTAMP)
ON CONFLICT ("emailDomain") DO NOTHING;

INSERT INTO "companies" ("id", "name", "emailDomain", "verified", "createdAt")
VALUES (gen_random_uuid()::text, 'Padu Analytics', 'paduanalytics.com', true, CURRENT_TIMESTAMP)
ON CONFLICT ("emailDomain") DO NOTHING;

INSERT INTO "skills" ("id", "name", "category")
VALUES (gen_random_uuid()::text, 'JavaScript', 'SOFTWARE')
ON CONFLICT ("name") DO NOTHING;

-- Note: RecruiterWeights and VerificationQuestion seed rows depend
-- on ids generated above (companyId/skillId), which this static SQL
-- file can't reference across statements the way seed.ts's
-- upsert-by-name logic can. Run `npx prisma db seed` after this file
-- for those two — or copy the ids from the Table Editor and insert
-- them by hand if you're avoiding the Prisma CLI entirely.

-- ============================================================
-- After running this file:
--   mkdir -p prisma/migrations/0_init
--   cp supabase/schema.sql prisma/migrations/0_init/migration.sql
--   npx prisma migrate resolve --applied 0_init
-- From then on, schema changes go through the normal
-- `npx prisma migrate dev --name <change>` flow.
-- ============================================================
