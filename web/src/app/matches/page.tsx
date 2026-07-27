/**
 * InternSage — Matches page
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-MATCHES-001
 * File   : src/app/matches/page.tsx
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  if (!user) return <div className="p-8 text-sm text-parchment-dim">Loading…</div>;

  return (
    <AppShell user={user}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl text-parchment">Your matches</h1>
        <Button onClick={handleRecompute} disabled={busy} size="sm">
          {busy ? "Recomputing…" : "Recompute"}
        </Button>
      </div>

      <div className="grid gap-4">
        {matches.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-parchment">{m.jobPosting.title}</h3>
                <p className="text-xs text-parchment-dim">{m.jobPosting.company.name}</p>
              </div>
              <div className="rounded-full border border-brass px-3 py-1 font-mono text-sm text-brass">
                {m.score}%
              </div>
            </div>
            <div className="mt-3 flex gap-6 text-xs">
              <div>
                <span className="text-verdigris">Matched: </span>
                <span className="text-parchment-dim">{m.matchedSkills.join(", ") || "—"}</span>
              </div>
              <div>
                <span className="text-oxide-500">Missing: </span>
                <span className="text-parchment-dim">{m.missingSkills.join(", ") || "—"}</span>
              </div>
            </div>
          </Card>
        ))}
        {matches.length === 0 && (
          <p className="text-sm text-parchment-dim">No matches yet — hit Recompute to generate some.</p>
        )}
      </div>
    </AppShell>
  );
}
