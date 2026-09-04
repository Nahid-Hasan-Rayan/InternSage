/**
 * InternSage — Matches page
 *
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchGauge } from "@/components/ui/match-gauge";
import { getSession, type SessionUser } from "@/lib/api";
import { getMyMatches, recomputeMyMatches, type MatchScoreItem } from "@/lib/internsage-api";

export default function MatchesPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [matches, setMatches] = React.useState<MatchScoreItem[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) return router.push("/login");
      setUser(session);
      setMatches(await getMyMatches().catch(() => []));
    });
  }, [router]);

  async function handleRecompute() {
    setBusy(true);
    try {
      setMatches(await recomputeMyMatches());
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl text-ink-900">Your matches</h1>
        <Button onClick={handleRecompute} disabled={busy} size="sm">
          {busy ? "Recomputing…" : "Recompute"}
        </Button>
      </div>

      <div className="grid gap-4">
        {matches.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink-900">{m.jobPosting.title}</h3>
                <p className="text-xs text-slate-500">{m.jobPosting.company.name}</p>
              </div>
              <MatchGauge value={m.score} size={64} warnBelow={50} />
            </div>
            <div className="mt-3 flex gap-6 text-xs">
              <div>
                <span className="text-signal-700">Matched: </span>
                <span className="text-slate-500">{m.matchedSkills.join(", ") || "—"}</span>
              </div>
              <div>
                <span className="text-alert-600">Missing: </span>
                <span className="text-slate-500">{m.missingSkills.join(", ") || "—"}</span>
              </div>
            </div>
          </Card>
        ))}
        {matches.length === 0 && (
          <p className="text-sm text-slate-500">No matches yet — hit Recompute to generate some.</p>
        )}
      </div>
    </AppShell>
  );
}
