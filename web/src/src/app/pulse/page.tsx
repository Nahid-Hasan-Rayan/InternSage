/**
 * InternSage — Industry Pulse
 *
 * See getIndustryPulse()'s JSDoc in internsage-api.ts for the exact
 * expected endpoint contract. Renders real data the moment that
 * endpoint exists — no frontend change needed when it does.
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import { getIndustryPulse, type PulseItem } from "@/lib/internsage-api";

export default function PulsePage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [items, setItems] = React.useState<PulseItem[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) {
        try {
          const res = await getIndustryPulse();
          setItems(res.items);
        } catch {
          setItems(null);
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
      <h1 className="font-display text-2xl text-ink-900">Industry Pulse</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        Sourced only from a verified-outlet allowlist — never generated summaries.
      </p>

      {items === null ? (
        <BackendPending feature="Industry Pulse" />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No stories yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="mono font-medium uppercase tracking-wide text-signal-600">{item.source}</span>
                <span>·</span>
                <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
              </div>
              <h2 className="mb-1.5 text-sm font-semibold text-ink-900">{item.headline}</h2>
              <p className="mb-2 text-xs text-slate-500">{item.summary}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-signal-700 hover:underline"
              >
                Read full story ↗
              </a>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
