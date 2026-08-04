/**
 * InternSage — AI Tutor
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-TUTOR-001
 * File   : src/app/tutor/page.tsx
 *
 * See sendTutorMessage()/getTutorHistory() JSDoc in internsage-api.ts
 * for the exact expected endpoint contract.
 */

"use client";

import * as React from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSession, type SessionUser } from "@/lib/api";
import { getTutorHistory, sendTutorMessage, type TutorMessage, type TutorPersona } from "@/lib/internsage-api";

const PERSONAS: { id: TutorPersona; label: string }[] = [
  { id: "Newton", label: "Newton — Physics & Engineering" },
  { id: "Curie", label: "Curie — Chemistry & Biology" },
  { id: "Euler", label: "Euler — Mathematics" },
  { id: "Lovelace", label: "Lovelace — Computing" },
];

export default function TutorPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [persona, setPersona] = React.useState<TutorPersona>("Newton");
  const [messages, setMessages] = React.useState<TutorMessage[] | null>(null);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [notConnected, setNotConnected] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const loadHistory = React.useCallback(async (p: TutorPersona) => {
    try {
      const res = await getTutorHistory(p);
      setMessages(res.items);
      setNotConnected(false);
    } catch {
      setMessages([]);
      setNotConnected(true);
    }
  }, []);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (s) await loadHistory(persona);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function switchPersona(p: TutorPersona) {
    setPersona(p);
    await loadHistory(p);
  }

  async function send() {
    if (!input.trim() || notConnected) return;
    const text = input;
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...(prev ?? []),
      { id: `local-${Date.now()}`, role: "user", body: text, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await sendTutorMessage(persona, text);
      setMessages((prev) => [
        ...(prev ?? []),
        { id: `local-reply-${Date.now()}`, role: "assistant", body: res.reply, createdAt: new Date().toISOString() },
      ]);
    } catch {
      setNotConnected(true);
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <AppShell user={user}>
      <h1 className="mb-4 font-display text-2xl text-ink-900">AI Tutor</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => switchPersona(p.id)}
            className={
              "rounded-full border px-3.5 py-1.5 text-xs transition-colors " +
              (persona === p.id
                ? "border-signal-600 bg-signal-100 font-medium text-signal-700"
                : "border-hairline text-slate-500 hover:bg-paper-100")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card className="flex h-[520px] flex-col p-0">
        <div className="flex-1 overflow-y-auto p-5">
          {notConnected ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
              AI Tutor isn&rsquo;t connected yet — this chat is fully built and ready once the backend is live.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={
                    "max-w-[75%] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm " +
                    (m.role === "user"
                      ? "self-end bg-signal-700 text-white"
                      : "self-start bg-paper-100 text-ink-900")
                  }
                >
                  {m.body}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <div className="flex gap-2 border-t border-hairline p-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Ask ${persona} anything…`}
            disabled={notConnected}
          />
          <Button onClick={send} loading={sending} disabled={notConnected}>
            Send
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
