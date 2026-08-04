/**
 * InternSage — University dashboard
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-UNIV-DASH-001
 * File   : src/app/university/dashboard/page.tsx
 *
 * See getUniversityDashboard()'s JSDoc in internsage-api.ts for the
 * exact expected endpoint contract.
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import { getUniversityDashboard, type UniversityDashboard } from "@/lib/internsage-api";

export default function UniversityDashboardPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [data, setData] = React.useState<UniversityDashboard | null>(null);
  const [notConnected, setNotConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) {
        try {
          setData(await getUniversityDashboard());
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
      <h1 className="font-display text-2xl text-ink-900">{data?.universityName ?? "University"} dashboard</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">Placement outcomes and partner activity, in one place.</p>

      {notConnected || !data ? (
        <BackendPending feature="University dashboard" />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Placement rate" value={`${data.stats.placementRatePct}%`} />
            <StatCard label="Students placed (YTD)" value={data.stats.studentsPlacedYtd} />
            <StatCard label="Active partners" value={data.stats.activePartners} />
            <StatCard label="Upcoming events" value={data.stats.upcomingEvents} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                Top hiring companies
              </h2>
              <div className="flex flex-col gap-2">
                {data.topCompanies.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="text-ink-900">{c.name}</span>
                    <span className="mono text-slate-500">{c.hires} hires</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                Top programmes by placement
              </h2>
              <div className="flex flex-col gap-2">
                {data.topProgrammes.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="text-ink-900">{p.name}</span>
                    <span className="mono text-signal-700">{p.placementRatePct}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-5">
            <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Recent activity
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-700">
              {data.recentActivity.map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="mono text-2xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </Card>
  );
}
