/**
 * InternSage — Job detail page
 *
 * New — the demo has a dedicated job-detail view (`page-jobdetail`)
 * that the real app never had; jobs/page.tsx only ever showed an
 * inline-apply card. This is that missing view, wired to
 * GET /jobs/:id (added to internsage-api.ts alongside this page).
 *
 * For students, cross-references GET /matches (already computed,
 * never live) to show which required skills are matched/missing —
 * same explainability principle as the Matches page, just scoped to
 * one posting instead of a list.
 */

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchGauge } from "@/components/ui/match-gauge";
import { getSession, type SessionUser } from "@/lib/api";
import { getJob, applyToJob, getMyMatches, type JobPosting, type MatchScoreItem } from "@/lib/internsage-api";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [job, setJob] = React.useState<JobPosting | null>(null);
  const [match, setMatch] = React.useState<MatchScoreItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session);
      try {
        const jobData = await getJob(params.id);
        setJob(jobData);
        if (session.role === "STUDENT") {
          try {
            const matches = await getMyMatches();
            setMatch(matches.find((m) => m.jobPosting.id === params.id) ?? null);
          } catch {
            setMatch(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load this posting.");
      } finally {
        setLoading(false);
      }
    });
  }, [params.id, router]);

  async function handleApply() {
    setApplying(true);
    setError(null);
    try {
      await applyToJob(params.id);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't apply.");
    } finally {
      setApplying(false);
    }
  }

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  if (error || !job) {
    return (
      <AppShell user={user}>
        <p className="text-sm text-alert-600">{error ?? "Posting not found."}</p>
        <Link href="/jobs" className="mt-3 inline-block text-xs text-signal-700 hover:underline">
          ← Back to jobs
        </Link>
      </AppShell>
    );
  }

  const matchedSet = new Set((match?.matchedSkills ?? []).map((s) => s.toLowerCase()));

  return (
    <AppShell user={user}>
      <Link href="/jobs" className="text-xs text-slate-500 hover:text-ink-900">
        ← Back to jobs
      </Link>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {job.company.name}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        {match && <MatchGauge value={match.score} size={72} warnBelow={50} label="match" />}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          <Card className="p-6">
            <h2 className="mono mb-2 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              About this role
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{job.description}</p>

            <h2 className="mono mb-2 mt-6 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Requirements
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{job.requirementsText}</p>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Required skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((rs) => {
                const isMatched = matchedSet.has(rs.skill.name.toLowerCase());
                const showState = user.role === "STUDENT" && match;
                return (
                  <span
                    key={rs.skill.id}
                    className={
                      "rounded-full border px-2.5 py-1 text-[11px] " +
                      (showState
                        ? isMatched
                          ? "border-signal-600 bg-signal-100 text-signal-700"
                          : "border-alert-600/30 bg-alert-100 text-alert-600"
                        : "border-hairline bg-paper-100 text-ink-700")
                    }
                  >
                    {showState ? (isMatched ? "✓ " : "✗ ") : ""}
                    {rs.skill.name}
                  </span>
                );
              })}
            </div>
            {user.role === "STUDENT" && !match && (
              <p className="mt-3 text-[11px] text-slate-500">
                Recompute your matches to see which of these you already have.
              </p>
            )}
          </Card>

          {user.role === "STUDENT" && (
            <Card className="p-5">
              {applied ? (
                <p className="text-sm text-signal-700">✓ Application submitted.</p>
              ) : (
                <Button onClick={handleApply} loading={applying} className="w-full">
                  Apply to this role
                </Button>
              )}
              {error && <p className="mt-2 text-xs text-alert-600">{error}</p>}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
