// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Phase 2/3 API client
 *
 * Thin typed wrappers over authedFetch — one function per backend
 * endpoint, mirroring the DTOs in server/src/**\/dto exactly rather
 * than inventing a parallel shape here.
 */

import { authedFetch, API_BASE } from "./api";

// ---- Jobs ---------------------------------------------------------

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirementsText: string;
  location: string | null;
  category: string | null;
  isActive: boolean;
  postedAt: string;
  company: { id: string; name: string };
  requiredSkills: Array<{ skill: { id: string; name: string } }>;
}

export async function listJobs(params: { keyword?: string; category?: string } = {}) {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.category) query.set("category", params.category);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return authedFetch<{ items: JobPosting[]; total: number }>(`/jobs${suffix}`);
}

// ---- CV (shared read, used by profile + verification pages) -------

export interface ClaimedSkill {
  /** The UserSkill row's own id — what VerificationService.startSession expects, NOT skillId. */
  id: string;
  skillId: string;
  skill: { id: string; name: string; category: string };
  verified: boolean;
  authenticityScore: number | null;
}

export interface FullCv {
  profile: { id: string; headline: string | null; visibility: string };
  skills: ClaimedSkill[];
  experiences: unknown[];
  educations: unknown[];
  projects: unknown[];
}

export async function getCv() {
  return authedFetch<FullCv>("/cv");
}

// ============================================================
// Features below have REAL frontend pages but NO backend yet —
// the person is building these backends now. Each function below
// documents the exact endpoint/response shape the frontend expects,
// so the backend has an unambiguous contract to build against.
// Every page that calls these degrades gracefully (a clear "not
// connected yet" message) if the endpoint 404s, rather than
// crashing — safe to ship before the backend exists.
// ============================================================

// ---- Industry Pulse ------------------------------------------------
// Expected: GET /industry-pulse?limit=20
// Curated headlines from a verified-outlet allowlist (see Master
// Blueprint's Industry Pulse section) — never AI-generated summaries,
// syndication snippets only, to avoid both copyright risk and
// misrepresenting a story.

export interface PulseItem {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  summary: string;
  url: string;
  tags: string[];
}

export async function getIndustryPulse(limit = 20) {
  return authedFetch<{ items: PulseItem[] }>(`/industry-pulse?limit=${limit}`);
}

// ---- AI Tutor --------------------------------------------------------
// Expected: POST /tutor/messages  body: { persona, message }
//           returns: { reply: string }
//           GET /tutor/messages?persona=X  returns: { items: TutorMessage[] }
// Persona chat history should be tied to the student's profile per
// the Blueprint, not a standalone save/load mechanism.

export type TutorPersona = "Newton" | "Curie" | "Euler" | "Lovelace";

export interface TutorMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
}

export async function getTutorHistory(persona: TutorPersona) {
  return authedFetch<{ items: TutorMessage[] }>(`/tutor/messages?persona=${persona}`);
}

export async function sendTutorMessage(persona: TutorPersona, message: string) {
  return authedFetch<{ reply: string }>("/tutor/messages", {
    method: "POST",
    body: JSON.stringify({ persona, message }),
  });
}

// ---- Guidance / Roadmap ------------------------------------------------
// Expected: GET /guidance/roadmap
//           returns gap analysis toward the student's target role,
//           built from anonymized aggregate archetypes — never a
//           scraped individual profile, per the Blueprint's boundary.

export interface RoadmapSkillStep {
  name: string;
  status: "verified" | "gap";
  verifyHref?: string;
}

export interface RoadmapArchetype {
  title: string;
  description: string;
  takenByPct: number;
}

export interface Roadmap {
  targetRole: string;
  steps: RoadmapSkillStep[];
  archetypes: RoadmapArchetype[];
}

export async function getRoadmap() {
  return authedFetch<Roadmap>("/guidance/roadmap");
}

// ---- University portal --------------------------------------------------
// Expected: a new Role value "UNIVERSITY" plus a UniversityAdmin
// profile scoped to exactly one University row (mirrors
// RecruiterProfile -> Company), and CAREER_CENTER_ADMIN-style
// ownership scoping on every endpoint below (same pattern as
// RecruiterToolsService — resolve the university from the caller's
// own profile, never trust a client-supplied universityId).

export interface UniversityDashboard {
  universityName: string;
  stats: { placementRatePct: number; studentsPlacedYtd: number; activePartners: number; upcomingEvents: number };
  topCompanies: Array<{ name: string; hires: number }>;
  topProgrammes: Array<{ name: string; placementRatePct: number }>;
  recentActivity: string[];
}

export async function getUniversityDashboard() {
  return authedFetch<UniversityDashboard>("/university/dashboard");
}

export interface UniversityPartner {
  id: string;
  name: string;
  industry: string;
}

export async function getUniversityPartners(params: { search?: string; industry?: string } = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.industry && params.industry !== "all") q.set("industry", params.industry);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return authedFetch<{ items: UniversityPartner[] }>(`/university/partners${suffix}`);
}

export interface UniversityEvent {
  id: string;
  title: string;
  date: string;
  registeredCount: number;
  status: "ACTIVE" | "UPCOMING";
}

export async function getUniversityEvents() {
  return authedFetch<{ items: UniversityEvent[] }>("/university/events");
}

export async function createUniversityEvent(input: { title: string; date: string }) {
  return authedFetch<UniversityEvent>("/university/events", { method: "POST", body: JSON.stringify(input) });
}

export interface UniversityAnalytics {
  outcomes: { employedOrStudyingPct: number; avgStartingSalaryRm: number; avgOffersPerStudent: number };
  byFaculty: Array<{ name: string; employabilityPct: number }>;
  byIndustry: Array<{ name: string; pct: number }>;
}

export async function getUniversityAnalytics() {
  return authedFetch<UniversityAnalytics>("/university/analytics");
}

export async function getJob(id: string) {
  return authedFetch<JobPosting>(`/jobs/${id}`);
}

export async function createJob(input: {
  title: string;
  description: string;
  requirementsText: string;
  location?: string;
  category?: string;
  requiredSkillIds: string[];
}) {
  return authedFetch<JobPosting>("/jobs", { method: "POST", body: JSON.stringify(input) });
}

export async function deactivateJob(id: string) {
  return authedFetch<JobPosting>(`/jobs/${id}`, { method: "DELETE" });
}

// ---- Skills (for the required-skills picker on job creation) -----

export interface SkillOption {
  id: string;
  name: string;
  category: string;
}

export async function listSkills() {
  return authedFetch<SkillOption[]>("/cv/skills");
}

// ---- Matches -------------------------------------------------------

export interface MatchScoreItem {
  id: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  jobPosting: { id: string; title: string; company: { name: string } };
}

export async function getMyMatches() {
  return authedFetch<MatchScoreItem[]>("/matches");
}

export async function recomputeMyMatches() {
  return authedFetch<MatchScoreItem[]>("/matches/recompute", { method: "POST" });
}

// ---- Applications ---------------------------------------------------

export interface ApplicationItem {
  id: string;
  status: string;
  createdAt: string;
  jobPosting?: { id: string; title: string; company: { name: string } };
}

export async function applyToJob(jobPostingId: string) {
  return authedFetch<ApplicationItem>(`/applications/${jobPostingId}`, { method: "POST" });
}

export async function getMyApplications() {
  return authedFetch<ApplicationItem[]>("/applications/mine");
}

export async function getApplicationsForRecruiter() {
  return authedFetch<ApplicationItem[]>("/applications/recruiter");
}

export async function updateApplicationStatus(id: string, status: string) {
  return authedFetch<ApplicationItem>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---- Recruiter tools -------------------------------------------------

export interface RecruiterWeights {
  companyId: string;
  skillsWeight: number;
  projectsWeight: number;
  authenticityWeight: number;
  softSkillsWeight: number;
}

export async function getMyWeights() {
  return authedFetch<RecruiterWeights>("/recruiter-tools/weights");
}

export async function updateMyWeights(weights: Omit<RecruiterWeights, "companyId">) {
  return authedFetch<RecruiterWeights>("/recruiter-tools/weights", {
    method: "PUT",
    body: JSON.stringify(weights),
  });
}

// ---- Sage Copilot -----------------------------------------------------

export interface CopilotResult {
  blocked: boolean;
  appliedFilters: Record<string, unknown>;
  results: Array<{ userId: string; major: string | null; year: number | null; universityName?: string }>;
}

export async function queryCopilot(question: string) {
  return authedFetch<CopilotResult>("/copilot/query", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ---- Interview kits & scorecards -------------------------------------

export interface InterviewKit {
  id: string;
  roleTitle: string;
  criteria: Array<{ label: string; description?: string }>;
}

export async function listInterviewKits() {
  return authedFetch<InterviewKit[]>("/recruiter-tools/interview-kits");
}

export async function createInterviewKit(input: {
  roleTitle: string;
  criteria: Array<{ label: string; description?: string }>;
}) {
  return authedFetch<InterviewKit>("/recruiter-tools/interview-kits", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface Scorecard {
  id: string;
  ratings: Record<string, number>;
  notes?: string;
  recommendation: string;
  createdAt: string;
  interviewKit: { roleTitle: string; criteria: Array<{ label: string }> };
}

export async function submitScorecard(
  applicationId: string,
  input: { interviewKitId: string; ratings: Record<string, number>; notes?: string; recommendation: string },
) {
  return authedFetch<Scorecard>(`/recruiter-tools/applications/${applicationId}/scorecards`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listScorecards(applicationId: string) {
  return authedFetch<Scorecard[]>(`/recruiter-tools/applications/${applicationId}/scorecards`);
}

// ---- Messaging ---------------------------------------------------------

export interface MessageItem {
  id: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export async function listMessages(applicationId: string) {
  return authedFetch<MessageItem[]>(`/applications/${applicationId}/messages`);
}

export async function sendMessage(applicationId: string, body: string) {
  return authedFetch<MessageItem>(`/applications/${applicationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export interface VerificationQuestionView {
  id: string;
  prompt: string;
  choices: string[];
}

export async function startVerification(userSkillId: string) {
  return authedFetch<{ sessionId: string; expiresAt: string; questions: VerificationQuestionView[] }>(
    "/verification/sessions",
    { method: "POST", body: JSON.stringify({ userSkillId }) },
  );
}

export async function submitVerification(sessionId: string, answers: number[]) {
  return authedFetch<{ score: number; verified: boolean; correctAnswers: number; totalQuestions: number }>(
    `/verification/sessions/${sessionId}/submit`,
    { method: "POST", body: JSON.stringify({ answers }) },
  );
}

// ---- Decision Room (student market-intelligence dashboard) ----------------
// Expected: GET /decision-room/trends (batch-computed weekly, never
// live-per-request). GET /decision-room/insights (short, server-
// generated notes tied to the student's own profile).

export interface TrendPoint { period: string; value: number; }
export interface SkillDemandTrend { skillName: string; points: TrendPoint[]; changePct: number; }
export interface SalaryBand { role: string; region: string; p25: number; median: number; p75: number; }
export interface DecisionRoomTrends { skillDemand: SkillDemandTrend[]; salaryBands: SalaryBand[]; updatedAt: string; }

export async function getDecisionRoomTrends() {
  return authedFetch<DecisionRoomTrends>("/decision-room/trends");
}

export interface DecisionRoomInsight { id: string; text: string; tone: "positive" | "neutral" | "attention"; }

export async function getDecisionRoomInsights() {
  return authedFetch<{ items: DecisionRoomInsight[] }>("/decision-room/insights");
}

// ---- Verified exports (watermarked, code-checkable) ------------------------
// Expected: POST /exports/verified body:{reportType} -> {code,downloadUrl,issuedAt}
// GET /verify/:code (PUBLIC) -> {valid,reportType,issuedTo,issuedAt} or 404.
// Code must be server-issued/stored — never accepted just because a
// client presents one.

export type VerifiedReportType = "decision-room-progress" | "university-analytics" | "recruiter-analytics";
export interface VerifiedExport { code: string; downloadUrl: string; issuedAt: string; }

export async function requestVerifiedExport(reportType: VerifiedReportType) {
  return authedFetch<VerifiedExport>("/exports/verified", { method: "POST", body: JSON.stringify({ reportType }) });
}

export interface VerificationResult { valid: boolean; reportType?: VerifiedReportType; issuedTo?: string; issuedAt?: string; }

/** Public — no auth. */
export async function verifyExportCode(code: string) {
  const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(code)}`);
  if (res.status === 404) return { valid: false } as VerificationResult;
  if (!res.ok) throw new Error("Couldn't check this code right now.");
  return (await res.json()) as VerificationResult;
}

// ---- Featured students (university showcase) -------------------------------
export interface FeaturedStudentCandidate { userId: string; fullName: string; major: string | null; verifiedSkillCount: number; avgAuthenticityScore: number | null; }
export interface FeaturedStudent { id: string; userId: string; fullName: string; major: string | null; reason: string; featuredAt: string; }

export async function getFeaturedStudentCandidates() {
  return authedFetch<{ items: FeaturedStudentCandidate[] }>("/university/featured-students/candidates");
}
export async function getFeaturedStudents() {
  return authedFetch<{ items: FeaturedStudent[] }>("/university/featured-students");
}
export async function featureStudent(studentUserId: string, reason: string) {
  return authedFetch<FeaturedStudent>("/university/featured-students", { method: "POST", body: JSON.stringify({ studentUserId, reason }) });
}
export async function unfeatureStudent(id: string) {
  return authedFetch<void>(`/university/featured-students/${id}`, { method: "DELETE" });
}

// ---- Recruiter company analytics -------------------------------------------
export interface RecruiterAnalytics {
  funnel: { applied: number; underReview: number; interview: number; offer: number; rejected: number };
  avgTimeToOfferDays: number | null;
  topSkillsAmongApplicants: Array<{ skill: string; count: number }>;
  postingPerformance: Array<{ jobTitle: string; applicants: number; avgMatchScore: number }>;
}
export async function getRecruiterAnalytics() {
  return authedFetch<RecruiterAnalytics>("/recruiter-tools/analytics");
}
