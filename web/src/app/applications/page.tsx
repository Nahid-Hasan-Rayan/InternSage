/**
 * InternSage — Applications page
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-APPS-001
 * File   : src/app/applications/page.tsx
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { getSession, type SessionUser } from "@/lib/api";
import {
  getMyApplications,
  getApplicationsForRecruiter,
  updateApplicationStatus,
  type ApplicationItem,
} from "@/lib/internsage-api";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW", "OFFER", "REJECTED"];

export default function ApplicationsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);

  const load = React.useCallback(async (role: string) => {
    const list = role === "STUDENT" ? await getMyApplications() : await getApplicationsForRecruiter();
    setApplications(list);
  }, []);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) return router.push("/login");
      setUser(session);
      await load(session.role);
    });
  }, [router, load]);

  async function handleStatusChange(id: string, status: string) {
    await updateApplicationStatus(id, status);
    if (user) await load(user.role);
  }

  if (!user) return <div className="p-8 text-sm text-parchment-dim">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-6 font-display text-xl text-parchment">
        {user.role === "STUDENT" ? "Your applications" : "Applicants"}
      </h1>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id} className="flex items-center justify-between p-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-parchment">
                {app.jobPosting?.title ?? "Job posting"}
              </h3>
              <p className="text-xs text-parchment-dim">{app.jobPosting?.company.name}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <Link href={`/applications/${app.id}/messages`} className="text-brass hover:underline">
                  Messages
                </Link>
                {user.role === "RECRUITER" && (
                  <Link href={`/applications/${app.id}/scorecard`} className="text-brass hover:underline">
                    Scorecard
                  </Link>
                )}
              </div>
            </div>
            {user.role === "RECRUITER" ? (
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                className="rounded-[4px] border border-hairline bg-ink-800 px-2 py-1 text-xs text-parchment"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full border border-brass px-3 py-1 text-xs text-brass">
                {app.status.replace("_", " ")}
              </span>
            )}
          </Card>
        ))}
        {applications.length === 0 && <p className="text-sm text-parchment-dim">Nothing here yet.</p>}
      </div>
    </AppShell>
  );
}
