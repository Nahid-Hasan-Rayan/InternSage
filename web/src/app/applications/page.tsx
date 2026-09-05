// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Applications page
 *
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

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-6 font-display text-xl text-ink-900">
        {user.role === "STUDENT" ? "Your applications" : "Applicants"}
      </h1>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id} className="flex items-center justify-between p-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-ink-900">
                {app.jobPosting?.title ?? "Job posting"}
              </h3>
              <p className="text-xs text-slate-500">{app.jobPosting?.company.name}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <Link href={`/applications/${app.id}/messages`} className="text-signal-700 hover:underline">
                  Messages
                </Link>
                {user.role === "RECRUITER" && (
                  <Link href={`/applications/${app.id}/scorecard`} className="text-signal-700 hover:underline">
                    Scorecard
                  </Link>
                )}
              </div>
            </div>
            {user.role === "RECRUITER" ? (
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                className="rounded-[4px] border border-hairline bg-paper-100 px-2 py-1 text-xs text-ink-900"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full border border-signal-600 px-3 py-1 text-xs text-signal-700">
                {app.status.replace("_", " ")}
              </span>
            )}
          </Card>
        ))}
        {applications.length === 0 && <p className="text-sm text-slate-500">Nothing here yet.</p>}
      </div>
    </AppShell>
  );
}
