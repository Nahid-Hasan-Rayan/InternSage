/**
 * InternSage — University analytics
 *
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import { getUniversityAnalytics, type UniversityAnalytics } from "@/lib/internsage-api";

export default function UniversityAnalyticsPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [data, setData] = React.useState<UniversityAnalytics | null>(null);
  const [notConnected, setNotConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) {
        try {
          setData(await getUniversityAnalytics());
        } catch {
          setNotConnected(true);
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <h1 className="mb-1 font-display text-2xl text-ink-900">Placement analytics</h1>
      <p className="mb-8 text-sm text-slate-500">Outcomes across faculties and industries.</p>

      {notConnected || !data ? (
        <BackendPending feature="University analytics" />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="mono text-2xl font-semibold text-signal-700">
                {data.outcomes.employedOrStudyingPct}%
              </p>
              <p className="mt-1 text-xs text-slate-500">Employed or studying, 6mo out</p>
            </Card>
            <Card className="p-4">
              <p className="mono text-2xl font-semibold text-ink-900">
                RM{data.outcomes.avgStartingSalaryRm.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Avg. starting salary</p>
            </Card>
            <Card className="p-4">
              <p className="mono text-2xl font-semibold text-ink-900">{data.outcomes.avgOffersPerStudent}</p>
              <p className="mt-1 text-xs text-slate-500">Avg. offers per student</p>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                Employability by faculty
              </h2>
              <div className="flex flex-col gap-2.5">
                {data.byFaculty.map((f) => (
                  <div key={f.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink-900">{f.name}</span>
                      <span className="mono text-slate-500">{f.employabilityPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-paper-100">
                      <div
                        className="h-full rounded-full bg-signal-700"
                        style={{ width: `${f.employabilityPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                Placement by industry
              </h2>
              <div className="flex flex-col gap-2.5">
                {data.byIndustry.map((i) => (
                  <div key={i.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink-900">{i.name}</span>
                      <span className="mono text-slate-500">{i.pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-paper-100">
                      <div className="h-full rounded-full bg-warn-600/70" style={{ width: `${i.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
