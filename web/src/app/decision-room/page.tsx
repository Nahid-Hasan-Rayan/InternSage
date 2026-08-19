/**
 * InternSage — Decision Room
 * Author: Nahid Hasan Rayan
 * File: src/app/decision-room/page.tsx
 *
 * "Your progress" uses REAL data from existing endpoints (works
 * today, no backend change needed, exportable to CSV right now).
 * "Industry trends" and "AI insights" need new backend work — see
 * getDecisionRoomTrends/getDecisionRoomInsights contracts below —
 * and show BackendPending until connected, never faked data.
 */

"use client";

import * as React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackendPending } from "@/components/ui/backend-pending";
import { getSession, type SessionUser } from "@/lib/api";
import {
  getMyApplications, getMyMatches, getCv, getDecisionRoomTrends, getDecisionRoomInsights,
  requestVerifiedExport, type ApplicationItem, type MatchScoreItem,
  type DecisionRoomTrends, type DecisionRoomInsight,
} from "@/lib/internsage-api";
import { downloadCsv } from "@/lib/csv-export";

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "#a8abb2", UNDER_REVIEW: "#2563eb", INTERVIEW: "#a6741f",
  OFFER: "#27443a", REJECTED: "#b3402f", WITHDRAWN: "#e4e2dc",
};

export default function DecisionRoomPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);
  const [matches, setMatches] = React.useState<MatchScoreItem[]>([]);
  const [verifiedCount, setVerifiedCount] = React.useState(0);
  const [totalSkills, setTotalSkills] = React.useState(0);
  const [trends, setTrends] = React.useState<DecisionRoomTrends | null>(null);
  const [insights, setInsights] = React.useState<DecisionRoomInsight[] | null>(null);
  const [trendsConnected, setTrendsConnected] = React.useState(true);
  const [insightsConnected, setInsightsConnected] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [pdfExporting, setPdfExporting] = React.useState(false);
  const [verifiedUrl, setVerifiedUrl] = React.useState<string | null>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getSession().then(async (s) => {
      setUser(s);
      if (!s) { setLoading(false); return; }
      const [apps, myMatches, cv] = await Promise.all([
        getMyApplications().catch(() => []),
        getMyMatches().catch(() => []),
        getCv().catch(() => null),
      ]);
      setApplications(apps);
      setMatches(myMatches);
      if (cv) {
        setTotalSkills(cv.skills.length);
        setVerifiedCount(cv.skills.filter((sk) => sk.verified).length);
      }
      getDecisionRoomTrends().then(setTrends).catch(() => setTrendsConnected(false));
      getDecisionRoomInsights().then((r) => setInsights(r.items)).catch(() => setInsightsConnected(false));
      setLoading(false);
    });
  }, []);

  const statusBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of applications) counts[app.status] = (counts[app.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [applications]);

  const matchTrend = React.useMemo(
    () => matches.slice().reverse().map((m, i) => ({ index: i + 1, score: m.score, title: m.jobPosting.title })),
    [matches],
  );

  const velocityTrend = React.useMemo(() => {
    const byWeek = new Map<string, number>();
    for (const app of applications) {
      const week = getIsoWeekLabel(new Date(app.createdAt));
      byWeek.set(week, (byWeek.get(week) ?? 0) + 1);
    }
    return Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count }));
  }, [applications]);

  const avgMatchScore = matches.length
    ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length)
    : null;

  const topMissingSkills = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matches) for (const skill of m.missingSkills) counts.set(skill, (counts.get(skill) ?? 0) + 1);
    return Array.from(counts.entries()).sort(([, a], [, b]) => b - a).slice(0, 5).map(([skill, count]) => ({ skill, count }));
  }, [matches]);

  async function exportProgressCsv() {
    setExporting(true);
    setExportError(null);
    let watermark: { code: string; issuedAt: string } | null = null;
    try {
      const issued = await requestVerifiedExport("decision-room-progress");
      watermark = { code: issued.code, issuedAt: issued.issuedAt };
    } catch {
      // Verification issuance isn't connected yet — export still happens.
    }
    downloadCsv("internsage-progress-report", [
      { metric: "Total applications", value: applications.length },
      { metric: "Average match score", value: avgMatchScore ?? "—" },
      { metric: "Verified skills", value: `${verifiedCount} / ${totalSkills}` },
      ...applications.map((a) => ({ metric: `Application: ${a.jobPosting?.title ?? "Untitled posting"}`, value: a.status })),
      { metric: "—", value: "—" },
      { metric: "Verification code", value: watermark ? watermark.code : "UNVERIFIED (backend not connected)" },
      { metric: "Issued at", value: watermark?.issuedAt ?? new Date().toISOString() },
      { metric: "Verify at", value: watermark ? `internsage.app/verify/${watermark.code}` : "—" },
    ]);
    setExporting(false);
  }

  async function generateVerifiedReport() {
    setPdfExporting(true);
    setExportError(null);
    try {
      const result = await requestVerifiedExport("decision-room-progress");
      setVerifiedUrl(result.downloadUrl);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Verified PDF reports aren't connected yet — the CSV export above works today.");
    } finally {
      setPdfExporting(false);
    }
  }

  if (loading || !user) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <AppShell user={user}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Decision Room</h1>
          <p className="mt-1 text-sm text-slate-500">Your progress, market trends, and what they mean for you — one screen, no spreadsheet.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" loading={exporting} onClick={exportProgressCsv}>Export CSV (watermarked)</Button>
          <Button size="sm" loading={pdfExporting} onClick={generateVerifiedReport}>Generate verified PDF</Button>
        </div>
      </div>

      {exportError && <p className="mb-4 text-xs text-alert-600">{exportError}</p>}
      {verifiedUrl && (
        <Card className="mb-6 flex items-center justify-between p-4">
          <p className="text-sm text-ink-900">Your watermarked, code-verifiable report is ready.</p>
          <Button asChild size="sm" variant="ghost"><a href={verifiedUrl} target="_blank" rel="noopener noreferrer">Download →</a></Button>
        </Card>
      )}

      <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Your progress</h2>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="mono text-3xl font-semibold text-ink-900">{applications.length}</p><p className="mt-1 text-xs text-slate-500">Total applications</p></Card>
        <Card className="p-5"><p className="mono text-3xl font-semibold text-signal-700">{avgMatchScore ?? "—"}</p><p className="mt-1 text-xs text-slate-500">Average match score</p></Card>
        <Card className="p-5"><p className="mono text-3xl font-semibold text-ink-900">{verifiedCount}/{totalSkills}</p><p className="mt-1 text-xs text-slate-500">Skills verified</p></Card>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-ink-900">Applications by status</h3>
          {statusBreakdown.length === 0 ? <p className="text-xs text-slate-500">Apply to a few roles to see this fill in.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="count" nameKey="status" innerRadius={45} outerRadius={75}>
                  {statusBreakdown.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#a8abb2"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-ink-900">Match score over time</h3>
          {matchTrend.length === 0 ? <p className="text-xs text-slate-500">Recompute your matches to see this trend.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={matchTrend}>
                <CartesianGrid stroke="#e4e2dc" strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#1e362d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-ink-900">Application velocity</h3>
          {velocityTrend.length === 0 ? <p className="text-xs text-slate-500">Your weekly application pace will show up here.</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={velocityTrend}>
                <CartesianGrid stroke="#e4e2dc" strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#27443a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-ink-900">Most common skill gaps</h3>
          {topMissingSkills.length === 0 ? <p className="text-xs text-slate-500">No gaps to show yet — great sign, or recompute your matches.</p> : (
            <div className="flex flex-col gap-2">
              {topMissingSkills.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-ink-900">{s.skill}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-100">
                    <div className="h-full rounded-full bg-alert-600/70" style={{ width: `${(s.count / topMissingSkills[0].count) * 100}%` }} />
                  </div>
                  <span className="mono w-6 text-right text-xs text-slate-500">{s.count}</span>
                </div>
              ))}
              <a href="/roadmap" className="mt-1 text-xs text-signal-700 hover:underline">See your full roadmap →</a>
            </div>
          )}
        </Card>
      </div>

      <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">What this means for you</h2>
      <div className="mb-10">
        {!insightsConnected || insights === null ? <BackendPending feature="AI insights" /> : insights.length === 0 ? (
          <p className="text-sm text-slate-500">No insights yet — check back once you have more matches.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((ins) => (
              <Card key={ins.id} className={"p-4 text-sm " + (ins.tone === "positive" ? "border-signal-600/30 bg-signal-100" : ins.tone === "attention" ? "border-alert-600/20 bg-alert-100" : "")}>
                {ins.text}
              </Card>
            ))}
          </div>
        )}
      </div>

      <h2 className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Industry &amp; salary trends</h2>
      {!trendsConnected || !trends ? <BackendPending feature="Industry trends" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-medium text-ink-900">Skill demand movement</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart>
                <CartesianGrid stroke="#e4e2dc" strokeDasharray="3 3" />
                <XAxis dataKey="period" allowDuplicatedCategory={false} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {trends.skillDemand.slice(0, 4).map((skill, i) => (
                  <Line key={skill.skillName} data={skill.points} dataKey="value" name={skill.skillName} stroke={["#1e362d", "#a6741f", "#2563eb", "#b3402f"][i % 4]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-3">
              {trends.skillDemand.slice(0, 4).map((s) => (
                <span key={s.skillName} className="text-[11px] text-slate-500">
                  {s.skillName} <span className={s.changePct >= 0 ? "text-signal-700" : "text-alert-600"}>{s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct)}%</span>
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-medium text-ink-900">Salary bands by role</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends.salaryBands}>
                <CartesianGrid stroke="#e4e2dc" strokeDasharray="3 3" />
                <XAxis dataKey="role" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="p25" stackId="a" fill="#e8efeb" />
                <Bar dataKey="median" stackId="a" fill="#27443a" />
                <Bar dataKey="p75" stackId="a" fill="#1e362d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function getIsoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
