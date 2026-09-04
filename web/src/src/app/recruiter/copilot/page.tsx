/**
 * InternSage — Sage Copilot page
 *
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSession, type SessionUser } from "@/lib/api";
import { queryCopilot, type CopilotResult } from "@/lib/internsage-api";

export default function CopilotPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [question, setQuestion] = React.useState("");
  const [result, setResult] = React.useState<CopilotResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    getSession().then((session) => {
      if (!session) return router.push("/login");
      setUser(session);
    });
  }, [router]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setResult(await queryCopilot(question));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-2 font-display text-xl text-ink-900">Sage Copilot</h1>
      <p className="mb-6 text-sm text-slate-500">
        Ask a question about your applicant pool — e.g. "who knows React and is verified".
      </p>

      <form onSubmit={handleAsk} className="mb-6 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask Sage Copilot…"
          className="flex-1"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Thinking…" : "Ask"}
        </Button>
      </form>

      {result?.blocked && (
        <Card className="mb-4 border-alert-600 p-4 text-sm text-alert-600">
          This question touches a protected characteristic and can&apos;t be run.
        </Card>
      )}

      {result && !result.blocked && (
        <div className="grid gap-3">
          {result.results.map((r) => (
            <Card key={r.userId} className="flex justify-between p-4 text-sm">
              <span className="text-ink-900">
                {r.major ?? "Unknown major"} · Year {r.year ?? "?"}
              </span>
              <span className="text-slate-500">{r.universityName}</span>
            </Card>
          ))}
          {result.results.length === 0 && (
            <p className="text-sm text-slate-500">No matching candidates in your applicant pool.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}
