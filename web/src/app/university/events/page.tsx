// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — University events
 *
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import { getUniversityEvents, createUniversityEvent, type UniversityEvent } from "@/lib/internsage-api";

export default function UniversityEventsPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [events, setEvents] = React.useState<UniversityEvent[] | null>(null);
  const [notConnected, setNotConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await getUniversityEvents();
      setEvents(res.items);
      setNotConnected(false);
    } catch {
      setNotConnected(true);
    }
  }, []);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) await load();
      setLoading(false);
    });
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createUniversityEvent({ title, date });
      setTitle("");
      setDate("");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create event.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Career events</h1>
          <p className="text-sm text-slate-500">Fairs, info sessions, and 1:1 booths.</p>
        </div>
        {!notConnected && (
          <Button size="sm" variant="ghost" onClick={() => setShowForm((v) => !v)}>
            + New event
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="ev-title">Title</Label>
              <Input id="ev-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ev-date">Date</Label>
              <Input id="ev-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="submit" size="sm" loading={busy}>
              Create
            </Button>
          </form>
          {error && <p className="mt-2 text-xs text-alert-600">{error}</p>}
        </Card>
      )}

      {notConnected || events === null ? (
        <BackendPending feature="University events" />
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-500">No events scheduled yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((ev) => (
            <Card key={ev.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink-900">{ev.title}</p>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                    (ev.status === "ACTIVE" ? "bg-signal-100 text-signal-700" : "bg-paper-100 text-slate-500")
                  }
                >
                  {ev.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(ev.date).toLocaleDateString()} · {ev.registeredCount} registered
              </p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
