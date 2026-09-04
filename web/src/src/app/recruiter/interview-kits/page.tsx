/**
 * InternSage — Interview kits page
 *
 * One kit per role, reused across every candidate for that role —
 * never per-application — so evaluation stays comparable. This
 * mirrors RecruiterToolsService's own design note.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { Label } from "@/components/ui/label";
import { getSession, type SessionUser } from "@/lib/api";
import { listInterviewKits, createInterviewKit, type InterviewKit } from "@/lib/internsage-api";

export default function InterviewKitsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [kits, setKits] = React.useState<InterviewKit[]>([]);
  const [roleTitle, setRoleTitle] = React.useState("");
  const [criteriaText, setCriteriaText] = React.useState("Communication\nTechnical depth\nOwnership");
  const [message, setMessage] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => setKits(await listInterviewKits()), []);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) return router.push("/login");
      if (session.role !== "RECRUITER") return router.push("/dashboard");
      setUser(session);
      await refresh();
    });
  }, [router, refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const criteria = criteriaText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((label) => ({ label }));
      await createInterviewKit({ roleTitle, criteria });
      setMessage("Kit created.");
      setRoleTitle("");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create kit.");
    }
  }

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-2 font-display text-xl text-ink-900">Interview kits</h1>
      <p className="mb-6 text-sm text-slate-500">
        One kit per role, reused for every candidate — this is what makes scorecards comparable.
      </p>

      <Card className="mb-6 max-w-lg p-5">
        <form onSubmit={handleCreate} className="grid gap-3">
          <FormField
            id="roleTitle"
            label="Role title"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
          />
          <div>
            <Label htmlFor="criteria">Criteria (one per line)</Label>
            <textarea
              id="criteria"
              className="mt-1 h-24 w-full rounded-[4px] border border-hairline bg-paper-100 p-2 text-sm text-ink-900 outline-none"
              value={criteriaText}
              onChange={(e) => setCriteriaText(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-fit">
            Create kit
          </Button>
          {message && <p className="text-xs text-signal-700">{message}</p>}
        </form>
      </Card>

      <div className="grid gap-3">
        {kits.map((kit) => (
          <Card key={kit.id} className="p-4">
            <h3 className="font-display text-sm font-semibold text-ink-900">{kit.roleTitle}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {kit.criteria.map((c) => (
                <span key={c.label} className="rounded-full bg-paper-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {c.label}
                </span>
              ))}
            </div>
          </Card>
        ))}
        {kits.length === 0 && <p className="text-sm text-slate-500">No kits yet.</p>}
      </div>
    </AppShell>
  );
}
