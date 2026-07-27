/**
 * InternSage — Messages page
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-MESSAGES-001
 * File   : src/app/applications/[id]/messages/page.tsx
 *
 * REST + a short poll interval, not a WebSocket — matches
 * MessagingService's own note: Vercel serverless functions don't
 * hold a persistent connection open the way a socket needs.
 */

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSession, type SessionUser } from "@/lib/api";
import { listMessages, sendMessage, type MessageItem } from "@/lib/internsage-api";

const POLL_INTERVAL_MS = 8000;

export default function MessagesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const applicationId = params.id;

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [messages, setMessages] = React.useState<MessageItem[]>([]);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setMessages(await listMessages(applicationId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    }
  }, [applicationId]);

  React.useEffect(() => {
    getSession().then(async (session) => {
      if (!session) return router.push("/login");
      setUser(session);
      await refresh();
    });
  }, [router, refresh]);

  React.useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await sendMessage(applicationId, draft);
      setDraft("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    }
  }

  if (!user) return <div className="p-8 text-sm text-parchment-dim">Loading…</div>;

  return (
    <AppShell user={user}>
      <h1 className="mb-6 font-display text-xl text-parchment">Conversation</h1>

      {error && <p className="mb-3 text-xs text-oxide-500">{error}</p>}

      <Card className="mb-4 flex max-w-xl flex-col gap-3 p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-[4px] px-3 py-2 text-sm ${
              m.senderUserId === user.id ? "self-end bg-brass/20 text-parchment" : "self-start bg-ink-700 text-parchment"
            }`}
          >
            {m.body}
            <div className="mt-1 text-[10px] text-parchment-dim">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-parchment-dim">No messages yet — say hello.</p>}
      </Card>

      <form onSubmit={handleSend} className="flex max-w-xl gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" className="flex-1" />
        <Button type="submit">Send</Button>
      </form>
    </AppShell>
  );
}
