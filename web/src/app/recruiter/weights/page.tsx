// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Scoring rubric page
 *
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSession, type SessionUser } from "@/lib/api";
import { getMyWeights, updateMyWeights, type RecruiterWeights } from "@/lib/internsage-api";

const FIELDS: Array<{ key: keyof Omit<RecruiterWeights, "companyId">; label: string }> = [
  { key: "skillsWeight", label: "Skills overlap" },
  { key: "projectsWeight", label: "Projects / experience similarity" },
  { key: "authenticityWeight", label: "Verified authenticity score" },
  { key: "softSkillsWeight", label: "Soft skills self-assessment" },
];

export default function WeightsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [weights, setWeights] = React.useState<RecruiterWeights | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) return router.push("/login");
      setUser(session);
      setWeights(await getMyWeights());
    });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!weights) return;
    const { companyId, ...rest } = weights;
    const updated = await updateMyWeights(rest);
    setWeights(updated);
    setMessage("Saved.");
  }

  if (!user || !weights) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-2 font-display text-xl text-ink-900">Scoring rubric</h1>
      <p className="mb-6 text-sm text-slate-500">
        These weights don&apos;t need to sum to 1 — they&apos;re multipliers MatchingService applies when scoring
        candidates for your postings.
      </p>

      <Card className="max-w-md p-5">
        <form onSubmit={handleSave} className="grid gap-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>
                {f.label} ({weights[f.key]})
              </Label>
              <input
                id={f.key}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weights[f.key]}
                onChange={(e) => setWeights({ ...weights, [f.key]: Number(e.target.value) })}
                className="w-full accent-signal-700"
              />
            </div>
          ))}
          <Button type="submit">Save rubric</Button>
          {message && <p className="text-xs text-signal-700">{message}</p>}
        </form>
      </Card>
    </AppShell>
  );
}
