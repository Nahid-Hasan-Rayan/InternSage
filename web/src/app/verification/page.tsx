/**
 * InternSage — Verification (quiz) page
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-VERIFICATION-001
 * File   : src/app/verification/page.tsx
 *
 * New — the backend (VerificationService, fully tested) and the API
 * client (startVerification/submitVerification) already existed;
 * there was simply no page. Timing is enforced server-side
 * (VerificationService checks expiresAt) — the countdown shown here
 * is a UX convenience only, never the actual guarantee; a late
 * submit is still rejected by the backend regardless of what this
 * page's timer shows.
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession, type SessionUser } from "@/lib/api";
import {
  getCv,
  startVerification,
  submitVerification,
  type ClaimedSkill,
  type VerificationQuestionView,
} from "@/lib/internsage-api";

interface SessionState {
  sessionId: string;
  expiresAt: string;
  questions: VerificationQuestionView[];
}

interface Result {
  score: number;
  verified: boolean;
  correctAnswers: number;
  totalQuestions: number;
}

export default function VerificationPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [skills, setSkills] = React.useState<ClaimedSkill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<SessionState | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [result, setResult] = React.useState<Result | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) {
        try {
          const cv = await getCv();
          setSkills(cv.skills);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't load your skills.");
        }
      }
      setLoading(false);
    });
  }, []);

  async function start(userSkillId: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const s = await startVerification(userSkillId);
      setSession(s);
      setAnswers(new Array(s.questions.length).fill(-1));
      setCurrent(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start a verification session.");
    } finally {
      setBusy(false);
    }
  }

  function selectAnswer(choiceIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = choiceIndex;
      return next;
    });
  }

  async function submit() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitVerification(session.sessionId, answers);
      setResult(res);
      setSession(null);
      const cv = await getCv();
      setSkills(cv.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your answers.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <h1 className="font-display text-2xl text-ink-900">Skill verification</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        A short, timed quiz for one claimed skill at a time — never ambient monitoring, just this.
      </p>

      {error && <p className="mb-4 text-sm text-alert-600">{error}</p>}

      {result && (
        <Card className="mb-8 p-6">
          <p className="mono text-3xl font-semibold text-ink-900">{result.score}%</p>
          <p className="mt-1 text-sm text-slate-500">
            {result.correctAnswers} / {result.totalQuestions} correct
          </p>
          <p className={"mt-3 text-sm font-medium " + (result.verified ? "text-signal-700" : "text-alert-600")}>
            {result.verified ? "✓ Verified" : "Not verified — below the pass threshold. You can try again anytime."}
          </p>
        </Card>
      )}

      {session ? (
        <Card className="p-6">
          {/* Progress dots — mirrors the demo's quiz-dots pattern */}
          <div className="mb-6 flex items-center gap-1.5">
            {session.questions.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1.5 flex-1 rounded-full transition-colors " +
                  (i < current ? "bg-signal-700" : i === current ? "bg-signal-600/50" : "bg-hairline")
                }
              />
            ))}
          </div>
          <p className="mb-1 text-xs text-slate-500">
            Question {current + 1} of {session.questions.length}
          </p>
          <h2 className="mb-5 text-lg font-medium text-ink-900">{session.questions[current].prompt}</h2>
          <div className="flex flex-col gap-2">
            {session.questions[current].choices.map((choice, ci) => (
              <button
                key={ci}
                onClick={() => selectAnswer(ci)}
                className={
                  "rounded-[var(--radius-btn)] border px-4 py-3 text-left text-sm transition-colors " +
                  (answers[current] === ci
                    ? "border-signal-600 bg-signal-100 font-medium text-signal-700"
                    : "border-hairline hover:border-signal-600/40 hover:bg-paper-100")
                }
              >
                {choice}
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
            >
              ← Previous
            </Button>
            {current < session.questions.length - 1 ? (
              <Button size="sm" disabled={answers[current] === -1} onClick={() => setCurrent((c) => c + 1)}>
                Next →
              </Button>
            ) : (
              <Button size="sm" loading={busy} disabled={answers.some((a) => a === -1)} onClick={submit}>
                Submit
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {skills.length === 0 && (
            <p className="text-sm text-slate-500">
              Add a skill on your{" "}
              <a href="/profile" className="text-signal-700 hover:underline">
                profile
              </a>{" "}
              first, then come back here to verify it.
            </p>
          )}
          {skills.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-ink-900">{s.skill.name}</p>
                <p className="text-xs text-slate-500">
                  {s.verified ? `Verified · ${s.authenticityScore}%` : "Not verified yet"}
                </p>
              </div>
              <Button size="sm" variant="ghost" loading={busy} onClick={() => start(s.id)}>
                {s.verified ? "Re-verify" : "Verify"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
