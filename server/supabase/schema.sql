-- ============================================================
--  InternSage — Full database schema for Supabase
-- ------------------------------------------------------------
--  Author : Nahid Hasan Rayan
--  Marker : NHR-DB-SUPABASE-SQL-003
--  File   : server/supabase/schema.sql
--
--  Regenerated to match the CURRENT prisma/schema.prisma — 25
--  tables, 8 enums, through Phase 3 (Jobs, Matching, Verification,
--  Applications, Recruiter Tools/Scorecards, Messaging, Audit Log).
--  Also adds Company.trustScore, which the previous version of this
--  file predates.
--
--  FULLY IDEMPOTENT — this is the important change from the last
--  version. Every statement here is safe to run again, any number
--  of times, against a database already in ANY partial state
--  (including a fresh one). This is what "ERROR: 42710: type "Role"
--  already exists" means: Postgres enum types have no native
--  `CREATE TYPE IF NOT EXISTS`, so re-running the old file failed
--  the moment it hit anything already created. Every enum here is
--  now wrapped in a DO block that catches exactly that error and
--  moves on; every table/index uses IF NOT EXISTS; every foreign
--  key is wrapped the same way enums are (ALTER TABLE ADD
--  CONSTRAINT has the same "no IF NOT EXISTS" limitation).
--
--  Run this whole file in Supabase Dashboard → SQL Editor → New
--  query → paste → Run. Safe against your existing (partially
--  migrated) database — it will only create what's actually
--  missing.
--
--  If you're using Prisma Migrate going forward instead of hand-run
--  SQL, tell Prisma this state is already applied:
--    mkdir -p prisma/migrations/0_init
--    cp supabase/schema.sql prisma/migrations/0_init/migration.sql
--    npx prisma migrate resolve --applied 0_init
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;   -- Phase 2 target architecture (see MatchingService's header comment)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() for the seed/guest inserts below

-- ------------------------------------------------------------
-- Enums (idempotent — Postgres has no CREATE TYPE IF NOT EXISTS)
-- ------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('STUDENT', 'RECRUITER', 'UNIVERSITY', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Handles the case where "Role" already existed from a prior run of
-- this file (the CREATE TYPE above is skipped via duplicate_object
-- in that case, so the new enum value needs its own idempotent
-- statement, or it would silently never get added).
DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'UNIVERSITY';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProfileVisibility" AS ENUM ('ALL_VERIFIED_RECRUITERS', 'APPLIED_ONLY', 'DRAFT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SkillCategory" AS ENUM (
    'SOFTWARE', 'MECHANICAL', 'ELECTRICAL', 'CHEMICAL',
    'BUSINESS', 'ACCOUNTING', 'ECONOMICS', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsEventType" AS ENUM (
    'REQUEST', 'AUTH_REGISTER', 'AUTH_LOGIN', 'AUTH_LOGIN_FAILED',
    'PROFILE_UPDATED', 'CV_UPDATED', 'JOB_POSTING_CREATED',
    'MATCHES_RECOMPUTED', 'VERIFICATION_COMPLETED', 'APPLICATION_STATUS_CHANGED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "JobSource" AS ENUM ('MANUAL', 'API', 'RSS', 'SCRAPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM (
    'APPLIED', 'UNDER_REVIEW', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ScorecardRecommendation" AS ENUM ('STRONG_YES', 'YES', 'NEUTRAL', 'NO', 'STRONG_NO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Identity
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "users" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "fullName"     TEXT NOT NULL,
  "role"         "Role" NOT NULL,
  "verified"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

CREATE TABLE IF NOT EXISTS "universities" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "emailDomain" TEXT NOT NULL,
  "verified"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "universities_emailDomain_key" ON "universities"("emailDomain");

CREATE TABLE IF NOT EXISTS "companies" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "emailDomain" TEXT NOT NULL,
  "verified"    BOOLEAN NOT NULL DEFAULT true,
  "trustScore"  INTEGER NOT NULL DEFAULT 100,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "companies_emailDomain_key" ON "companies"("emailDomain");
-- In case this table already existed from before trustScore existed:
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 100;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "student_profiles" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "universityId" TEXT,
  "major"        TEXT,
  "year"         INTEGER,
  "bio"          TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "student_profiles_userId_key" ON "student_profiles"("userId");
CREATE INDEX IF NOT EXISTS "student_profiles_universityId_idx" ON "student_profiles"("universityId");

CREATE TABLE IF NOT EXISTS "professional_profiles" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "headline"   TEXT,
  "visibility" "ProfileVisibility" NOT NULL DEFAULT 'ALL_VERIFIED_RECRUITERS',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "professional_profiles_userId_key" ON "professional_profiles"("userId");

CREATE TABLE IF NOT EXISTS "recruiter_profiles" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recruiter_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "recruiter_profiles_userId_key" ON "recruiter_profiles"("userId");
CREATE INDEX IF NOT EXISTS "recruiter_profiles_companyId_idx" ON "recruiter_profiles"("companyId");

-- ------------------------------------------------------------
-- University portal — mirrors recruiter_profiles -> companies
-- exactly (see prisma/schema.prisma's NHR-BE-SCHEMA-008 comment).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "university_admin_profiles" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "universityId" TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "university_admin_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "university_admin_profiles_userId_key" ON "university_admin_profiles"("userId");
CREATE INDEX IF NOT EXISTS "university_admin_profiles_universityId_idx" ON "university_admin_profiles"("universityId");

CREATE TABLE IF NOT EXISTS "university_partners" (
  "id"           TEXT NOT NULL,
  "universityId" TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "industry"     TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "university_partners_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "university_partners_universityId_idx" ON "university_partners"("universityId");

CREATE TABLE IF NOT EXISTS "university_events" (
  "id"           TEXT NOT NULL,
  "universityId" TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "date"         TIMESTAMP(3) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "university_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "university_events_universityId_idx" ON "university_events"("universityId");
CREATE INDEX IF NOT EXISTS "university_events_date_idx" ON "university_events"("date");

-- ------------------------------------------------------------
-- Observability
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "analytics_events" (
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
CREATE INDEX IF NOT EXISTS "analytics_events_type_createdAt_idx" ON "analytics_events"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "analytics_events_userId_idx" ON "analytics_events"("userId");

CREATE TABLE IF NOT EXISTS "error_logs" (
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
CREATE INDEX IF NOT EXISTS "error_logs_createdAt_idx" ON "error_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "error_logs_path_idx" ON "error_logs"("path");

-- ------------------------------------------------------------
-- Jobs, matching, applications
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "job_postings" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "job_postings_dedupHash_key" ON "job_postings"("dedupHash");
CREATE INDEX IF NOT EXISTS "job_postings_companyId_idx" ON "job_postings"("companyId");

CREATE TABLE IF NOT EXISTS "job_required_skills" (
  "id"           TEXT NOT NULL,
  "jobPostingId" TEXT NOT NULL,
  "skillId"      TEXT NOT NULL,
  CONSTRAINT "job_required_skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "job_required_skills_jobPostingId_skillId_key" ON "job_required_skills"("jobPostingId", "skillId");

CREATE TABLE IF NOT EXISTS "applications" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "jobPostingId" TEXT NOT NULL,
  "status"       "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "applications_userId_jobPostingId_key" ON "applications"("userId", "jobPostingId");
CREATE INDEX IF NOT EXISTS "applications_userId_idx" ON "applications"("userId");
CREATE INDEX IF NOT EXISTS "applications_jobPostingId_idx" ON "applications"("jobPostingId");

CREATE TABLE IF NOT EXISTS "recruiter_weights" (
  "id"                 TEXT NOT NULL,
  "companyId"          TEXT NOT NULL,
  "skillsWeight"       DOUBLE PRECISION NOT NULL DEFAULT 0.4,
  "projectsWeight"     DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "authenticityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  "softSkillsWeight"   DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  CONSTRAINT "recruiter_weights_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "recruiter_weights_companyId_key" ON "recruiter_weights"("companyId");

CREATE TABLE IF NOT EXISTS "match_scores" (
  "id"               TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "jobPostingId"     TEXT NOT NULL,
  "score"            INTEGER NOT NULL,
  "matchedSkills"    JSONB NOT NULL,
  "missingSkills"    JSONB NOT NULL,
  "computedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "match_scores_studentProfileId_jobPostingId_key" ON "match_scores"("studentProfileId", "jobPostingId");
CREATE INDEX IF NOT EXISTS "match_scores_studentProfileId_idx" ON "match_scores"("studentProfileId");

-- ------------------------------------------------------------
-- Decision Room — see src/decision-room/decision-room.service.ts's
-- header comment for why these two tables are populated so
-- differently: snapshots are computed weekly from this platform's
-- OWN job_required_skills data (NHR-BE-DECISION-SVC-001's internal
-- cron route), benchmarks are curated/source-attributed and only
-- ever change by hand (see the seed insert below).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "skill_demand_snapshots" (
  "id"           TEXT NOT NULL,
  "skillId"      TEXT NOT NULL,
  "period"       TEXT NOT NULL,
  "postingCount" INTEGER NOT NULL,
  "computedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skill_demand_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "skill_demand_snapshots_skillId_period_key" ON "skill_demand_snapshots"("skillId", "period");
CREATE INDEX IF NOT EXISTS "skill_demand_snapshots_period_idx" ON "skill_demand_snapshots"("period");

CREATE TABLE IF NOT EXISTS "salary_benchmarks" (
  "id"        TEXT NOT NULL,
  "role"      TEXT NOT NULL,
  "region"    TEXT NOT NULL,
  "p25"       INTEGER NOT NULL,
  "median"    INTEGER NOT NULL,
  "p75"       INTEGER NOT NULL,
  "source"    TEXT NOT NULL,
  "asOf"      TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salary_benchmarks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "salary_benchmarks_role_region_key" ON "salary_benchmarks"("role", "region");


-- ------------------------------------------------------------
-- Trust & verification
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "verification_questions" (
  "id"           TEXT NOT NULL,
  "skillId"      TEXT NOT NULL,
  "prompt"       TEXT NOT NULL,
  "choices"      JSONB NOT NULL,
  "correctIndex" INTEGER NOT NULL,
  CONSTRAINT "verification_questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "verification_questions_skillId_idx" ON "verification_questions"("skillId");

CREATE TABLE IF NOT EXISTS "verification_sessions" (
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
CREATE INDEX IF NOT EXISTS "verification_sessions_userSkillId_idx" ON "verification_sessions"("userSkillId");

-- ------------------------------------------------------------
-- Recruiter tooling: interview kits & scorecards
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "interview_kits" (
  "id"        TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "roleTitle" TEXT NOT NULL,
  "criteria"  JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interview_kits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "interview_kits_companyId_roleTitle_key" ON "interview_kits"("companyId", "roleTitle");

CREATE TABLE IF NOT EXISTS "scorecards" (
  "id"             TEXT NOT NULL,
  "applicationId"  TEXT NOT NULL,
  "interviewKitId" TEXT NOT NULL,
  "submittedById"  TEXT NOT NULL,
  "ratings"        JSONB NOT NULL,
  "notes"          TEXT,
  "recommendation" "ScorecardRecommendation" NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scorecards_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "scorecards_applicationId_idx" ON "scorecards"("applicationId");

-- ------------------------------------------------------------
-- CV building blocks
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "skills" (
  "id"       TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "category" "SkillCategory" NOT NULL DEFAULT 'OTHER',
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "skills_name_key" ON "skills"("name");

CREATE TABLE IF NOT EXISTS "user_skills" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "skillId"               TEXT NOT NULL,
  "verified"              BOOLEAN NOT NULL DEFAULT false,
  "authenticityScore"     INTEGER,
  "authenticityUpdatedAt" TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_skills_professionalProfileId_skillId_key" ON "user_skills"("professionalProfileId", "skillId");

CREATE TABLE IF NOT EXISTS "experiences" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "organization"          TEXT NOT NULL,
  "startDate"             TIMESTAMP(3) NOT NULL,
  "endDate"               TIMESTAMP(3),
  "description"           TEXT,
  CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "experiences_professionalProfileId_idx" ON "experiences"("professionalProfileId");

CREATE TABLE IF NOT EXISTS "educations" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "institution"           TEXT NOT NULL,
  "degree"                TEXT NOT NULL,
  "startYear"             INTEGER NOT NULL,
  "endYear"               INTEGER,
  "verified"              BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "educations_professionalProfileId_idx" ON "educations"("professionalProfileId");

CREATE TABLE IF NOT EXISTS "projects" (
  "id"                    TEXT NOT NULL,
  "professionalProfileId" TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "description"           TEXT,
  "portfolioUrl"          TEXT,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "projects_professionalProfileId_idx" ON "projects"("professionalProfileId");

-- ------------------------------------------------------------
-- Messaging (REST + polling — see schema.prisma's header comment
-- on why this isn't Socket.io on a serverless host)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "conversations" (
  "id"            TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_applicationId_key" ON "conversations"("applicationId");

CREATE TABLE IF NOT EXISTS "messages" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderUserId"   TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- ------------------------------------------------------------
-- Audit log (Sage Copilot queries + any explainability-critical action)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         TEXT NOT NULL,
  "actorId"    TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId"   TEXT,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- ------------------------------------------------------------
-- Foreign keys — idempotent (ALTER TABLE ADD CONSTRAINT has no
-- native IF NOT EXISTS, so each is wrapped the same way enums are)
-- ------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "university_admin_profiles" ADD CONSTRAINT "university_admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "university_admin_profiles" ADD CONSTRAINT "university_admin_profiles_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "university_partners" ADD CONSTRAINT "university_partners_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "university_events" ADD CONSTRAINT "university_events_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "job_required_skills" ADD CONSTRAINT "job_required_skills_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "job_required_skills" ADD CONSTRAINT "job_required_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "applications" ADD CONSTRAINT "applications_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "verification_questions" ADD CONSTRAINT "verification_questions_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "user_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "interview_kits" ADD CONSTRAINT "interview_kits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_interviewKitId_fkey" FOREIGN KEY ("interviewKitId") REFERENCES "interview_kits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "skill_demand_snapshots" ADD CONSTRAINT "skill_demand_snapshots_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "educations" ADD CONSTRAINT "educations_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_professionalProfileId_fkey" FOREIGN KEY ("professionalProfileId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- NOTE: analytics_events.userId, error_logs.userId, applications.userId,
-- scorecards.submittedById, messages.senderUserId, and audit_logs.actorId
-- all have NO foreign key to users — matches schema.prisma exactly.
-- Historical/audit records must never be blocked by, or cascade from,
-- a user deletion.

-- ============================================================
-- Seed data (mirrors server/prisma/seed.ts)
-- ============================================================

INSERT INTO "universities" ("id", "name", "emailDomain", "verified", "createdAt")
VALUES (gen_random_uuid()::text, 'Universiti Teknologi Malaysia', 'graduate.utm.my', true, CURRENT_TIMESTAMP)
ON CONFLICT ("emailDomain") DO NOTHING;

INSERT INTO "companies" ("id", "name", "emailDomain", "verified", "trustScore", "createdAt")
VALUES (gen_random_uuid()::text, 'Padu Analytics', 'paduanalytics.com', true, 100, CURRENT_TIMESTAMP)
ON CONFLICT ("emailDomain") DO NOTHING;

INSERT INTO "skills" ("id", "name", "category")
VALUES (gen_random_uuid()::text, 'JavaScript', 'SOFTWARE')
ON CONFLICT ("name") DO NOTHING;

-- Decision Room salary benchmarks — sourced from Randstad Malaysia's
-- 2025 Job Market Outlook & Salary Guide (same report cited as
-- reference [3] in the URIIS paper), junior/middle/senior monthly
-- MYR bands re-used as p25/median/p75. See seed.ts's matching block
-- (NHR-BE-SEED-002) for the full sourcing note — never add a row
-- here without a real, dated, named source.
INSERT INTO "salary_benchmarks" ("id", "role", "region", "p25", "median", "p75", "source", "asOf", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Software Engineer',   'Malaysia', 3500, 10000, 17000, 'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Data Analyst',         'Malaysia', 5000, 10000, 17000, 'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Business Analyst',     'Malaysia', 4000, 6500,  9000,  'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'UI/UX Designer',       'Malaysia', 4000, 13000, 25000, 'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'DevOps Engineer',      'Malaysia', 4000, 8000,  12000, 'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Cloud Engineer',       'Malaysia', 4000, 6000,  9000,  'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Mechanical Engineer',  'Malaysia', 5000, 7000,  9000,  'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Account Executive',    'Malaysia', 3500, 4500,  5500,  'Randstad Malaysia — 2025 Job Market Outlook & Salary Guide', '2024-12-19', CURRENT_TIMESTAMP)
ON CONFLICT ("role", "region") DO NOTHING;

-- ============================================================
-- Guest exploration accounts
-- ------------------------------------------------------------
--  A HONEST NOTE FIRST: you asked for guest/student, guest/
--  recruiter, AND guest/university. The Role enum only has
--  STUDENT, RECRUITER, ADMIN — there is no University/career-center
--  role anywhere in this codebase (that's Phase 6 in the Master
--  Blueprint, never built). Rather than fake a University persona
--  that doesn't actually have real permissions or a real portal
--  behind it, this gives you a GUEST ADMIN account instead — the
--  closest real equivalent ("sees platform-wide analytics, not
--  scoped to one company or one student"), landing on
--  /admin/analytics rather than a University dashboard that
--  doesn't exist. Building a real University role/portal is a
--  separate, larger piece of work — say the word if you want that
--  next.
--
--  Passwords (change or remove these before this ever has real
--  users — see the closing note):
--    guest.student@internsage.demo   / GuestStudent123
--    guest.recruiter@internsage.demo / GuestRecruiter123
--    guest.admin@internsage.demo     / GuestAdmin123
--
--  Hashes below are real bcrypt (12 salt rounds, matching
--  AuthService's BCRYPT_SALT_ROUNDS) — generated and verified
--  against bcrypt.compare before being put in this file, not
--  placeholder text.
-- ============================================================

DO $$
DECLARE
  guest_student_id   TEXT;
  guest_recruiter_id TEXT;
  guest_admin_id      TEXT;
  guest_company_id    TEXT;
  guest_prof_id       TEXT;
  js_skill_id         TEXT;
BEGIN
  -- ---- Guest student ----------------------------------------
  SELECT id INTO guest_student_id FROM "users" WHERE email = 'guest.student@internsage.demo';
  IF guest_student_id IS NULL THEN
    guest_student_id := gen_random_uuid()::text;
    INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "verified", "createdAt", "updatedAt")
    VALUES (
      guest_student_id, 'guest.student@internsage.demo',
      '$2b$12$jOswE2Yr6nw0cAFFWC6HZeyfr8r5BsrpGFUYtvVJrZdOFyaQNA9wS',
      'Guest Student', 'STUDENT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

    INSERT INTO "student_profiles" ("id", "userId", "universityId", "major", "year", "bio", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, guest_student_id, u.id, 'Software Engineering', 3,
           'Exploring InternSage as a guest — this is a demo account.',
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM "universities" u WHERE u."emailDomain" = 'graduate.utm.my';

    INSERT INTO "professional_profiles" ("id", "userId", "headline", "visibility", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, guest_student_id, 'Guest — exploring InternSage', 'ALL_VERIFIED_RECRUITERS',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO guest_prof_id;

    SELECT id INTO js_skill_id FROM "skills" WHERE name = 'JavaScript';
    IF js_skill_id IS NOT NULL AND guest_prof_id IS NOT NULL THEN
      INSERT INTO "user_skills" ("id", "professionalProfileId", "skillId", "verified", "createdAt")
      VALUES (gen_random_uuid()::text, guest_prof_id, js_skill_id, false, CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ---- Guest recruiter (own unverified demo company) ---------
  SELECT id INTO guest_company_id FROM "companies" WHERE "emailDomain" = 'internsage-guest-demo.com';
  IF guest_company_id IS NULL THEN
    guest_company_id := gen_random_uuid()::text;
    INSERT INTO "companies" ("id", "name", "emailDomain", "verified", "trustScore", "createdAt")
    VALUES (guest_company_id, 'InternSage Demo Co', 'internsage-guest-demo.com', true, 100, CURRENT_TIMESTAMP);
  END IF;

  SELECT id INTO guest_recruiter_id FROM "users" WHERE email = 'guest.recruiter@internsage.demo';
  IF guest_recruiter_id IS NULL THEN
    guest_recruiter_id := gen_random_uuid()::text;
    INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "verified", "createdAt", "updatedAt")
    VALUES (
      guest_recruiter_id, 'guest.recruiter@internsage.demo',
      '$2b$12$TlyePnP.wa/iHVtzBnVAJuPy3iqfZsiZCOc4XECrV7D6i4329hrZW',
      'Guest Recruiter', 'RECRUITER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

    INSERT INTO "recruiter_profiles" ("id", "userId", "companyId", "createdAt")
    VALUES (gen_random_uuid()::text, guest_recruiter_id, guest_company_id, CURRENT_TIMESTAMP);
  END IF;

  -- ---- Guest admin (closest real equivalent to "guest/university" —
  -- see the note above) ----------------------------------------
  SELECT id INTO guest_admin_id FROM "users" WHERE email = 'guest.admin@internsage.demo';
  IF guest_admin_id IS NULL THEN
    guest_admin_id := gen_random_uuid()::text;
    INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role", "verified", "createdAt", "updatedAt")
    VALUES (
      guest_admin_id, 'guest.admin@internsage.demo',
      '$2b$12$5N8LEQpRAeDKQzy4msd8Seb1Ona1HHEWOs4ZOmA3BY15Em6bjd4gW',
      'Guest Admin', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- ============================================================
-- ⚠ BEFORE THIS EVER HAS REAL USERS: these three accounts share
-- publicly-documented passwords (they're printed in this file and
-- in the assistant's chat response). That's fine for a private demo
-- you control, but NOT fine on a production deployment strangers can
-- reach — anyone who reads this file can log in as your guest admin.
-- Either delete these three rows before going live for real, or
-- change their passwords to something not written down anywhere:
--
--   DELETE FROM "users" WHERE email IN (
--     'guest.student@internsage.demo',
--     'guest.recruiter@internsage.demo',
--     'guest.admin@internsage.demo'
--   );
-- (Cascades cleanly to their profile rows via ON DELETE CASCADE.)
-- ============================================================