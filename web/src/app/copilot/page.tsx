// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiriWave } from "@/components/ui/siri-wave";
import { cn } from "@/lib/utils";
import { getSession, type SessionUser } from "@/lib/api";
import {
  queryCopilot,
  listCopilotConversations,
  getCopilotConversation,
  type CopilotConversationSummary,
  type CopilotMessage,
} from "@/lib/internsage-api";

const ROLE_PLACEHOLDER: Record<SessionUser["role"], string> = {
  RECRUITER: 'Ask Sage — e.g. "who in my pool knows React and is verified?"',
  STUDENT: 'Ask Sage — e.g. "how are my applications doing?" or "what should I fix on my CV?"',
  UNIVERSITY: 'Ask Sage — e.g. "how is our placement rate trending this year?"',
  ADMIN: "Ask Sage…",
};

const ROLE_GREETING: Record<SessionUser["role"], string> = {
  RECRUITER:
    "I'm Sage — think of me as your sourcing lead. Ask me to filter your applicant pool by skill, major, year, or verification, and I'll tell you who stands out and why.",
  STUDENT:
    "I'm Sage — your copilot for this whole job search. Ask me how your applications are doing, where your match scores are getting capped, or what to fix next.",
  UNIVERSITY:
    "I'm Sage — I can brief you on your cohort the way I'd brief a career-centre director. Ask about placement rate, top partners, or how a programme is trending.",
  ADMIN: "I'm Sage.",
};

interface ChatMessage {
  id: string;
  sender: "USER" | "SAGE";
  content: string;
}

export default function CopilotPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [conversations, setConversations] = React.useState<CopilotConversationSummary[]>([]);
  const [conversationId, setConversationId] = React.useState<string | undefined>(undefined);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [blockedNotice, setBlockedNotice] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    getSession().then((session) => {
      if (!session) return router.push("/login");
      setUser(session);
    });
  }, [router]);

  React.useEffect(() => {
    if (!user) return;
    listCopilotConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [user]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function openConversation(id: string) {
    setBusy(true);
    try {
      const detail = await getCopilotConversation(id);
      setConversationId(detail.id);
      setMessages(detail.messages.map((m: CopilotMessage) => ({ id: m.id, sender: m.sender, content: m.content })));
      setBlockedNotice(false);
    } finally {
      setBusy(false);
    }
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
    setBlockedNotice(false);
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    const optimisticUserMessage: ChatMessage = { id: `pending-${Date.now()}`, sender: "USER", content: trimmed };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setQuestion("");
    setBusy(true);
    setBlockedNotice(false);

    try {
      const result = await queryCopilot(trimmed, conversationId);
      setConversationId(result.conversationId);
      setMessages((prev) => [...prev, { id: `sage-${Date.now()}`, sender: "SAGE", content: result.message }]);
      setBlockedNotice(result.blocked);
      listCopilotConversations()
        .then(setConversations)
        .catch(() => undefined);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `sage-error-${Date.now()}`, sender: "SAGE", content: "I hit a snag reaching the server — try that again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <div className="flex h-[calc(100vh-6rem)] gap-4">
        {/* Conversation list */}
        <aside className="hidden w-64 shrink-0 flex-col gap-2 md:flex">
          <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={startNewConversation}>
            <Plus className="h-4 w-4" /> New conversation
          </Button>
          <div className="flex-1 overflow-y-auto pr-1">
            {conversations.length === 0 && (
              <p className="px-2 py-4 text-xs text-slate-400">Your conversations with Sage will show up here.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={cn(
                  "mb-1 flex w-full items-start gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-left text-sm transition-colors hover:bg-paper-100",
                  c.id === conversationId ? "bg-paper-100 text-ink-900" : "text-slate-600",
                )}
              >
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="line-clamp-2">{c.title ?? "Untitled conversation"}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat thread */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-center gap-3">
            <SiriWave variant="wave" size={44} active={busy} />
            <div>
              <h1 className="font-display text-xl text-ink-900">Sage Copilot</h1>
              <p className="text-xs text-slate-500">
                {user.role === "RECRUITER" && "Your applicant pool, in conversation."}
                {user.role === "STUDENT" && "Your job search, in conversation."}
                {user.role === "UNIVERSITY" && "Your cohort, in conversation."}
                {user.role === "ADMIN" && "Sage Copilot."}
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="mb-3 flex-1 overflow-y-auto rounded-[var(--radius-card)] border border-hairline bg-paper-50 p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Sparkles className="h-8 w-8 text-signal-600" />
                <p className="max-w-md text-sm text-slate-600">{ROLE_GREETING[user.role]}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.sender === "USER" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] whitespace-pre-wrap rounded-[var(--radius-card)] px-4 py-3 text-sm leading-relaxed",
                      m.sender === "USER"
                        ? "bg-signal-700 text-white"
                        : "border border-hairline bg-paper-0 text-ink-900",
                    )}
                  >
                    {m.sender === "SAGE" && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-signal-700">
                        <Sparkles className="h-3 w-3" /> Sage
                      </div>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-hairline bg-paper-0 px-4 py-3 text-sm text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-signal-600" /> Sage is thinking…
                  </div>
                </div>
              )}
            </div>
          </div>

          {blockedNotice && (
            <Card className="mb-3 border-alert-600 p-3 text-xs text-alert-600">
              That question touched a protected characteristic, so Sage didn&apos;t run it — see its reply above.
            </Card>
          )}

          <form onSubmit={handleAsk} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={ROLE_PLACEHOLDER[user.role]}
              className="flex-1"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !question.trim()}>
              {busy ? "Thinking…" : "Ask"}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
