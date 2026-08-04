/**
 * InternSage — Roadmap (Guidance Engine)
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-ROADMAP-001
 * File   : src/app/roadmap/page.tsx
 *
 * See getRoadmap()'s JSDoc in internsage-api.ts for the exact
 * expected endpoint contract. Archetypes are anonymized aggregate
 * patterns, never a real scraped individual's data — same boundary
 * the backend contract documents.
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import { getRoadmap, type Roadmap } from "@/lib/internsage-api";

export default function RoadmapPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [notConnected, setNotConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) {
        try {
          setRoadmap(await getRoadmap());
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
      <h1 className="font-display text-2xl text-ink-900">Your roadmap</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        A gap analysis toward your target role, built from anonymized aggregate patterns — never
        another student&rsquo;s actual profile.
      </p>

      {notConnected || !roadmap ? (
        <BackendPending feature="Roadmap" />
      ) : (
        <>
          <Card className="mb-6 p-6">
            <p className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Target: {roadmap.targetRole}
            </p>
            <div className="flex flex-col gap-2">
              {roadmap.steps.map((step) => (
                <div key={step.name} className="flex items-center justify-between border-t border-hairline py-2.5 first:border-t-0">
                  <span className="text-sm text-ink-900">{step.name}</span>
                  {step.status === "verified" ? (
                    <span className="rounded-full bg-signal-100 px-2.5 py-0.5 text-[11px] font-medium text-signal-700">
                      ✓ Verified
                    </span>
                  ) : (
                    <a
                      href={step.verifyHref ?? "/verification"}
                      className="rounded-full bg-alert-100 px-2.5 py-0.5 text-[11px] font-medium text-alert-600 hover:underline"
                    >
                      Gap — verify this
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            Which path resembles yours?
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {roadmap.archetypes.map((a) => (
              <Card key={a.title} className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-ink-900">{a.title}</h3>
                  <span className="mono text-xs text-slate-500">{a.takenByPct}% of grads</span>
                </div>
                <p className="text-sm text-slate-500">{a.description}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
