# InternSage — Monitoring & Analytics


This document explains what was added for observability, why it's split the way it is, and what to reach for next as the platform grows.

## The three questions this layer answers

| Question | System | Where |
|---|---|---|
| "Is the service healthy right now?" | Prometheus metrics | `GET /api/metrics` |
| "What happened, historically, that someone will want to look up?" | `AnalyticsEvent` / `ErrorLog` (Postgres) | `GET /api/analytics/admin/*` |
| "How are people actually using the product?" | Same tables, plus recommended third-party tools below | Admin dashboard at `/admin/analytics` |

These are deliberately three separate concerns sharing two writers (`RequestLoggingInterceptor`, `AllExceptionsFilter`) — see each file's header comment for the reasoning.

## What gets recorded automatically

Every HTTP request, success or failure, is recorded once:
- **Prometheus** — `internsage_http_requests_total`, `internsage_http_request_duration_seconds` (histogram), `internsage_http_errors_total`, plus Node.js default process metrics (memory, event loop lag, GC).
- **`AnalyticsEvent` (type=`REQUEST`)** — path, method, status, duration, and the user (if authenticated).

Product events recorded deliberately, from inside the relevant service:
- `AUTH_REGISTER`, `AUTH_LOGIN`, `AUTH_LOGIN_FAILED` — from `AuthService`.
- `PROFILE_UPDATED`, `CV_UPDATED` — the frontend calls `POST /api/analytics/event` (see `src/lib/analytics.ts`) after a successful save; wire this into `ProfileService`/`CvService` server-side too if you want it to be tamper-proof (a client can always choose not to send this call — fine for "what are people doing," not something to build trust/security logic on top of).

5xx errors additionally get a row in `ErrorLog` with a `requestId` — this is the ID returned to the client in every error response body and the `x-request-id` header. **When a user reports "something broke," ask for that ID** and look it up directly instead of searching logs by timestamp.

## Viewing it

1. **Admin dashboard** — `/admin/analytics` in the frontend. Requires an `ADMIN`-role account (see below).
2. **Raw API** — `GET /api/analytics/admin/summary?days=7`, `/routes`, `/traffic`, `/errors/top`, `/errors/recent`. All admin-only.
3. **Prometheus** — point a Prometheus server (or Grafana Cloud / Datadog's Prometheus receiver) at `GET /api/metrics`. Set `METRICS_TOKEN` in production and send it back as the `x-metrics-token` header — and still restrict the route at the network/ingress level; the token is defence in depth, not the only control.

## Creating an admin account

There is deliberately no self-service admin signup (same trust model as the rest of the platform — see the Master Blueprint). Promote an existing user directly in the database once you have one:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@internsage.example';
```

Or add a one-off row via `prisma/seed.ts`.

## Retention

Nothing is pruned automatically yet. Once volume grows, add a scheduled job (a cron-triggered Nest task, or a Supabase scheduled function) that deletes `AnalyticsEvent` rows older than N days — `ErrorLog` rows are worth keeping longer since they're low-volume and high-value for pattern-spotting across incidents.

## When to bring in a dedicated tool instead of extending this

This system is intentionally minimal — good enough to answer "is it broken" and "what are people doing" without adding a paid dependency on day one. Reach for something dedicated when:

- **Error tracking with alerting, stack-trace deduplication, source maps, Slack/email alerts** → [Sentry](https://sentry.io). Free tier is generous. Wire it into `AllExceptionsFilter`'s 5xx branch (`Sentry.captureException(exception)`) rather than replacing what's there — keep `ErrorLog` as your queryable-by-SQL source of truth, add Sentry for real-time alerting on top.
- **Session replay, funnels, heatmaps, feature flags, anonymous-visitor tracking** → [PostHog](https://posthog.com) (self-hostable, generous free tier) or [Plausible](https://plausible.io) (privacy-first, lighter weight, no cookie banner needed). Add their JS snippet to `layout.tsx`. Don't try to build this yourself — session recording and funnel analysis are genuinely hard problems these tools have already solved well.
- **Infra-level dashboards/alerting (CPU, memory, uptime, alert routing)** → Grafana Cloud or Datadog, pointed at `/api/metrics`. Vercel and Supabase (see below) also ship their own infra dashboards out of the box — check those first before adding a third tool.

## Deployment note (Vercel + Supabase)

See the root `README.md` for the full deployment guide. Two things specific to observability:
- `METRICS_TOKEN` — set this in Vercel's environment variables before your first production deploy; don't leave `/api/metrics` unauthenticated on a public URL.
- Vercel's own dashboard already gives you request logs, function duration, and error rate per deployment — `/api/metrics` and the `AnalyticsEvent` table are for **product-level** questions Vercel's dashboard can't answer (which routes, which users, signup funnel), not a replacement for it.
