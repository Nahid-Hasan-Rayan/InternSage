// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Scorecard page
 *
 */

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSession, type SessionUser } from "@/lib/api";
import {
  listInterviewKits,
  submitScorecard,
  listScorecards,
  type InterviewKit,
  type Scorecard,
} from "@/lib/internsage-api";

const RECOMMENDATIONS = ["STRONG_YES", "YES", "NEUTRAL", "NO", "STRONG_NO"];

export default function ScorecardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const applicationId = params.id;

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [kits, setKits] = React.useState<InterviewKit[]>([]);
  const [selectedKitId, setSelectedKitId] = React.useState("");
  const [ratings, setRatings] = React.useState<Record<string, number>>({});
  const [notes, setNotes] = React.useState("");
  const [recommendation, setRecommendation] = React.useState("YES");
  const [existing, setExisting] = React.useState<Scorecard[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  const selectedKit = kits.find((k) => k.id === selectedKitId);

  const refreshExisting = React.useCallback(
    async () => setExisting(await listScorecards(applicationId).catch(() => [])),
    [applicationId],
  );

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) return router.push("/login");
      if (session.role !== "RECRUITER") return router.push("/dashboard");
      setUser(session);
      setKits(await listInterviewKits());
      await refreshExisting();
    });
  }, [router, refreshExisting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitScorecard(applicationId, { interviewKitId: selectedKitId, ratings, notes, recommendation });
      setMessage("Scorecard submitted.");
      await refreshExisting();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not submit scorecard.");
    }
  }

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-6 font-display text-xl text-ink-900">Scorecard</h1>

      <Card className="mb-6 max-w-lg p-5">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="kit">Interview kit</Label>
            <select
              id="kit"
              value={selectedKitId}
              onChange={(e) => {
                setSelectedKitId(e.target.value);
                setRatings({});
              }}
              className="mt-1 w-full rounded-[4px] border border-hairline bg-paper-100 px-2 py-2 text-sm text-ink-900"
              required
            >
              <option value="">Select a kit…</option>
              {kits.map((kit) => (
                <option key={kit.id} value={kit.id}>
                  {kit.roleTitle}
                </option>
              ))}
            </select>
          </div>

          {selectedKit?.criteria.map((c) => (
            <div key={c.label}>
              <Label htmlFor={c.label}>
                {c.label} ({ratings[c.label] ?? 3}/5)
              </Label>
              <input
                id={c.label}
                type="range"
                min={1}
                max={5}
                value={ratings[c.label] ?? 3}
                onChange={(e) => setRatings({ ...ratings, [c.label]: Number(e.target.value) })}
                className="w-full accent-signal-700"
              />
            </div>
          ))}

          <div>
            <Label htmlFor="recommendation">Recommendation</Label>
            <select
              id="recommendation"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="mt-1 w-full rounded-[4px] border border-hairline bg-paper-100 px-2 py-2 text-sm text-ink-900"
            >
              {RECOMMENDATIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="mt-1 h-20 w-full rounded-[4px] border border-hairline bg-paper-100 p-2 text-sm text-ink-900 outline-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={!selectedKitId} className="w-fit">
            Submit scorecard
          </Button>
          {message && <p className="text-xs text-signal-700">{message}</p>}
        </form>
      </Card>

      <h2 className="mb-3 font-display text-sm font-semibold text-ink-900">Previous scorecards</h2>
      <div className="grid gap-3">
        {existing.map((sc) => (
          <Card key={sc.id} className="p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-900">{sc.interviewKit.roleTitle}</span>
              <span className="text-signal-700">{sc.recommendation.replace("_", " ")}</span>
            </div>
            {sc.notes && <p className="mt-1 text-xs text-slate-500">{sc.notes}</p>}
          </Card>
        ))}
        {existing.length === 0 && <p className="text-sm text-slate-500">No scorecards submitted yet.</p>}
      </div>
    </AppShell>
  );
}
