/**
 * InternSage — Dashboard
 *
 * Resolves the session client-side via getSession() (backed by
 * GET /auth/me) rather than trusting anything cached — the httpOnly
 * cookie is the only source of truth, and this page redirects to
 * /login whenever that resolves to null instead of assuming a role.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchGauge } from "@/components/ui/match-gauge";
import { getSession, type SessionUser } from "@/lib/api";
import { getMyMatches, type MatchScoreItem } from "@/lib/internsage-api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [topMatches, setTopMatches] = React.useState<MatchScoreItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session);
      if (session.role === "STUDENT") {
        // Best-effort — a fresh account with no matches computed yet
        // is a normal, expected state, not an error to surface here.
        try {
          const matches = await getMyMatches();
          setTopMatches(matches.slice(0, 3));
        } catch {
          setTopMatches([]);
        }
      }
      setLoading(false);
    });
  }, [router]);

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <h1 className="mb-2 font-display text-2xl text-ink-900">
        Welcome back, {user.fullName.split(" ")[0]}
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        {user.role === "STUDENT"
          ? "Your matches, applications, and profile in one place."
          : "Manage postings, review applicants, and run Sage Copilot searches."}
      </p>

      {user.role === "STUDENT" && topMatches.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="mono text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Your top matches
            </h2>
            <Link href="/matches" className="text-xs text-signal-700 hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {topMatches.map((m) => (
              <Card key={m.id} className="flex items-center gap-4 p-4">
                <MatchGauge value={m.score} size={52} warnBelow={50} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{m.jobPosting.title}</p>
                  <p className="truncate text-xs text-slate-500">{m.jobPosting.company.name}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {user.role === "STUDENT" ? (
          <>
            <DashboardCard href="/jobs" title="Browse jobs" description="Search active internship postings." />
            <DashboardCard
              href="/matches"
              title="Your matches"
              description="Explainable match scores, recomputed on demand."
            />
            <DashboardCard
              href="/applications"
              title="Applications"
              description="Track every application's status."
            />
            <DashboardCard href="/profile" title="Profile & CV" description="Skills, experience, and verification." />
          </>
        ) : (
          <>
            <DashboardCard href="/jobs" title="Postings" description="Post a role and manage your listings." />
            <DashboardCard
              href="/applications"
              title="Applicants"
              description="Review applications to your postings."
            />
            <DashboardCard
              href="/recruiter/interview-kits"
              title="Interview kits"
              description="Reusable evaluation criteria per role."
            />
            <DashboardCard
              href="/recruiter/copilot"
              title="Sage Copilot"
              description="Ask natural-language questions across your applicant pool."
            />
            <DashboardCard
              href="/recruiter/weights"
              title="Scoring rubric"
              description="Configure how match scores are weighted."
            />
          </>
        )}
      </div>
    </AppShell>
  );
}

function DashboardCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Card className="group flex flex-col gap-2 p-5 hover:-translate-y-0.5">
      <span className="mb-1 size-1.5 rounded-full bg-signal-700" />
      <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
      <p className="text-xs text-slate-500">{description}</p>
      <Button asChild size="sm" variant="ghost" className="mt-2 w-fit">
        <Link href={href}>
          Open <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </Button>
    </Card>
  );
}
