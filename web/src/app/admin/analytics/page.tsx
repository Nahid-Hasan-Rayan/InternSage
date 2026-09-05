// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Admin analytics dashboard
 *
 * Reads from the backend's ADMIN-only endpoints (see
 * AnalyticsController on the backend — @Roles(Role.ADMIN)). The
 * backend, not this page, is what actually enforces that a
 * non-admin can't see this data: a STUDENT or RECRUITER session
 * hitting these endpoints gets a 403 regardless of whether they
 * somehow load this route, so there's no separate client-side gate
 * to keep in sync here. See docs/MONITORING.md for how to create
 * an admin account (there's no self-service admin signup, by
 * design — see the Master Blueprint's trust model).
 */

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { authedFetch } from "@/lib/api";

interface Summary {
  windowDays: number;
  totalRequests: number;
  totalErrors: number;
  errorRatePct: number;
  newSignups: number;
  logins: number;
  failedLogins: number;
  activeUsers: number;
  avgResponseMs: number | null;
}

interface RouteRow {
  path: string | null;
  method: string | null;
  requests: number;
  avgResponseMs: number | null;
}

interface TrafficRow {
  day: string;
  total: number;
  errors: number;
}

interface TopErrorRow {
  message: string;
  path: string | null;
  statusCode: number;
  occurrences: number;
}

interface RecentErrorRow {
  id: string;
  message: string;
  path: string | null;
  method: string | null;
  statusCode: number;
  requestId: string;
  createdAt: string;
}

const WINDOW_DAYS = 7;

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [traffic, setTraffic] = useState<TrafficRow[]>([]);
  const [topErrors, setTopErrors] = useState<TopErrorRow[]>([]);
  const [recentErrors, setRecentErrors] = useState<RecentErrorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = `?days=${WINDOW_DAYS}`;
    Promise.all([
      authedFetch<Summary>(`/analytics/admin/summary${q}`),
      authedFetch<RouteRow[]>(`/analytics/admin/routes${q}`),
      authedFetch<TrafficRow[]>(`/analytics/admin/traffic${q}`),
      authedFetch<TopErrorRow[]>(`/analytics/admin/errors/top${q}`),
      authedFetch<RecentErrorRow[]>(`/analytics/admin/errors/recent${q}&limit=20`),
    ])
      .then(([s, r, t, te, re]) => {
        setSummary(s);
        setRoutes(r);
        setTraffic(t);
        setTopErrors(te);
        setRecentErrors(re);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main className="p-8 text-slate-500 text-sm">Loading analytics…</main>;
  }

  if (error) {
    return (
      <main className="p-8 text-sm text-red-400">
        Couldn&apos;t load analytics: {error}
        <br />
        This page requires an ADMIN account — see docs/MONITORING.md.
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-8 p-8 text-ink-900">
      <div>
        <h1 className="text-xl font-semibold">Platform analytics</h1>
        <p className="text-sm text-slate-500">Last {WINDOW_DAYS} days</p>
      </div>

      {summary && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Requests" value={summary.totalRequests} />
          <StatCard label="Errors" value={summary.totalErrors} sub={`${summary.errorRatePct}% error rate`} />
          <StatCard label="Active users" value={summary.activeUsers} />
          <StatCard label="Avg response" value={summary.avgResponseMs ? `${summary.avgResponseMs}ms` : "—"} />
          <StatCard label="New signups" value={summary.newSignups} />
          <StatCard label="Logins" value={summary.logins} />
          <StatCard label="Failed logins" value={summary.failedLogins} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Daily traffic
        </h2>
        <Card className="p-4">
          {traffic.length === 0 ? (
            <p className="text-sm text-slate-500">No traffic recorded yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2">Day</th>
                  <th className="pb-2">Requests</th>
                  <th className="pb-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {traffic.map((row) => (
                  <tr key={row.day} className="border-t border-hairline/40">
                    <td className="py-1.5">{new Date(row.day).toLocaleDateString()}</td>
                    <td className="py-1.5">{row.total}</td>
                    <td className="py-1.5">{row.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Top routes
        </h2>
        <Card className="p-4">
          {routes.length === 0 ? (
            <p className="text-sm text-slate-500">No request data yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2">Route</th>
                  <th className="pb-2">Requests</th>
                  <th className="pb-2">Avg response</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((row) => (
                  <tr key={`${row.method}-${row.path}`} className="border-t border-hairline/40">
                    <td className="py-1.5">
                      {row.method} {row.path}
                    </td>
                    <td className="py-1.5">{row.requests}</td>
                    <td className="py-1.5">{row.avgResponseMs ? `${row.avgResponseMs}ms` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Top errors (5xx)
        </h2>
        <Card className="p-4">
          {topErrors.length === 0 ? (
            <p className="text-sm text-slate-500">No server errors in this window — good sign.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2">Message</th>
                  <th className="pb-2">Route</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {topErrors.map((row, i) => (
                  <tr key={i} className="border-t border-hairline/40">
                    <td className="py-1.5">{row.message}</td>
                    <td className="py-1.5">{row.path}</td>
                    <td className="py-1.5">{row.statusCode}</td>
                    <td className="py-1.5">{row.occurrences}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent errors
        </h2>
        <Card className="p-4">
          {recentErrors.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing recent — good sign.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {recentErrors.map((row) => (
                <li key={row.id} className="border-t border-hairline/40 pt-2">
                  <div className="flex justify-between text-slate-500">
                    <span>{new Date(row.createdAt).toLocaleString()}</span>
                    <span>req: {row.requestId.slice(0, 8)}</span>
                  </div>
                  <div>
                    {row.method} {row.path} → {row.statusCode}
                  </div>
                  <div className="text-slate-500">{row.message}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </main>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}
