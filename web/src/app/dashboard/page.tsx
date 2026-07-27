/**
 * InternSage — Dashboard
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-DASH-001
 * File   : src/app/dashboard/page.tsx
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
import { getSession, type SessionUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session);
      setLoading(false);
    });
  }, [router]);

  if (loading || !user) {
    return <div className="p-8 text-sm text-parchment-dim">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <h1 className="mb-2 font-display text-xl text-parchment">
        Welcome back, {user.fullName.split(" ")[0]}
      </h1>
      <p className="mb-8 text-sm text-parchment-dim">
        {user.role === "STUDENT"
          ? "Your matches, applications, and profile in one place."
          : "Manage postings, review applicants, and run Sage Copilot searches."}
      </p>

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
    <Card className="flex flex-col gap-2 p-5">
      <h2 className="font-display text-sm font-semibold text-parchment">{title}</h2>
      <p className="text-xs text-parchment-dim">{description}</p>
      <Button asChild size="sm" variant="ghost" className="mt-2 w-fit">
        <Link href={href}>Open →</Link>
      </Button>
    </Card>
  );
}
