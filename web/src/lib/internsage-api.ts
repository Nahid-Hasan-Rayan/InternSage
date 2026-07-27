/**
 * InternSage — Phase 2/3 API client
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-API-002
 * File   : src/lib/internsage-api.ts
 *
 * Thin typed wrappers over authedFetch — one function per backend
 * endpoint, mirroring the DTOs in server/src/**\/dto exactly rather
 * than inventing a parallel shape here.
 */

import { authedFetch } from "./api";

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
