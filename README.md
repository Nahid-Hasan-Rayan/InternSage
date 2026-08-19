# InternSage

**Author:** Nahid Hasan Rayan

A monorepo containing both halves of InternSage:

```
internsage/
  web/     — Next.js frontend (App Router, React 19, Tailwind v4)
  server/  — NestJS backend (Prisma + Postgres, deployable as Vercel serverless functions)
  infra/   — docker-compose.yml for local Postgres+pgvector
```

Each of `web/` and `server/` has its own README with local-dev instructions. **This file is the deployment guide** — how to get both running on Vercel, backed by Supabase Postgres.

## Why two Vercel projects, one repo

Vercel deploys one "project" per app, but both can live in this single repository — you point Vercel at the same GitHub repo twice, with a different **Root Directory** each time. This is the standard, well-supported pattern for a monorepo with a separate frontend and backend (rather than trying to force NestJS into Next.js's `/api` routes, which would mean rewriting the whole backend).

| | Root Directory | What it deploys |
|---|---|---|
| Project 1 — `internsage-web` | `web` | The Next.js frontend |
| Project 2 — `internsage-api` | `server` | NestJS, running as Vercel serverless functions (see `server/api/index.ts`) |

They talk to each other over HTTPS: the frontend calls the backend's public Vercel URL, configured via `NEXT_PUBLIC_API_URL`.

## 1. Supabase setup (the database)

1. Create a project at [supabase.com](https://supabase.com).
2. **Enable pgvector** (needed for Phase 2's matching engine, harmless to enable now) — Project → Database → Extensions → search `vector` → Enable. Or run in the SQL editor:
   ```sql
   create extension if not exists vector;
   ```
3. Get your two connection strings from Project Settings → Database → Connection string:
   - **Transaction pooler** (port 6543) → this becomes `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=5` to the end — **not** `connection_limit=1`, see the note in `server/prisma/schema.prisma`'s datasource block (marker `NHR-BE-PERF-001`) for why that specific value was the confirmed cause of slow page loads.
   - **Direct connection** (port 5432) → this becomes `DIRECT_URL`.

   Why both: Vercel serverless functions are short-lived and can spin up many concurrent instances, each wanting its own DB connection — without pooling you exhaust Postgres's connection limit almost immediately. `prisma migrate`, however, needs a direct connection because PgBouncer's transaction mode doesn't support the prepared statements migrations use. See `server/prisma/schema.prisma`'s datasource block.

4. Run the migration once, from your own machine (not from Vercel — migrations shouldn't run as part of a serverless build):
   ```bash
   cd server
   cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, CORS_ORIGINS
   npm install
   npx prisma migrate deploy
   ```

   **Alternative — paste raw SQL instead:** if you'd rather not run Prisma CLI against production, `server/supabase/schema.sql` is a hand-derived, byte-for-byte match of `prisma/schema.prisma` you can paste directly into Supabase's SQL Editor. It includes the seed data too. See the comment at the top of that file for the one follow-up step (`prisma migrate resolve --applied`) so Prisma doesn't try to recreate the tables later.

## 2. Deploy the backend (`server/`)

1. In Vercel: **New Project** → import this repo → **Root Directory: `server`**.
2. Framework preset: **Other** (Vercel will pick up `server/vercel.json`, which routes everything through `server/api/index.ts`).
3. Environment variables (Project → Settings → Environment Variables) — set all of these for Production (and Preview, if you want preview deploys to work):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase pooled connection string (step 1) |
   | `DIRECT_URL` | Supabase direct connection string (step 1) |
   | `JWT_SECRET` | `openssl rand -base64 48` — 32+ chars, the app refuses to boot otherwise |
   | `JWT_EXPIRES_IN` | `1d` |
   | `CORS_ORIGINS` | Your frontend's Vercel URL, e.g. `https://internsage-web.vercel.app` (no trailing slash) |
   | `METRICS_TOKEN` | `openssl rand -base64 32` — see `server/docs/MONITORING.md` |
   | `NODE_ENV` | `production` |

4. Deploy. Vercel runs `npm run vercel-build` (which runs `prisma generate` — see `server/package.json`) before building the function.
5. Verify: `curl https://internsage-api.vercel.app/api/health` should return `{"status":"ok",...}`.

## 3. Deploy the frontend (`web/`)

1. In Vercel: **New Project** → import the same repo again → **Root Directory: `web`**.
2. Framework preset: **Next.js** (auto-detected).
3. Environment variable:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Your backend's Vercel URL from step 2, e.g. `https://internsage-api.vercel.app` (no trailing slash, no `/api` suffix — `web/src/lib/api.ts` appends that itself) |

4. Deploy.
5. **Go back to the backend project** and update `CORS_ORIGINS` to match the frontend's actual deployed URL (you won't know it until after the first deploy), then redeploy the backend.

## 4. Post-deploy checklist

- [ ] `GET https://internsage-api.vercel.app/api/health` → `200 {"status":"ok"}`
- [ ] Register a test account through the deployed frontend, confirm login works (cookie-based session — check that `CORS_ORIGINS` and the frontend URL match *exactly*, including `https://`)
- [ ] `GET https://internsage-api.vercel.app/api/metrics` with header `x-metrics-token: <your METRICS_TOKEN>` → Prometheus text output
- [ ] Promote your own account to `ADMIN` (see `server/docs/MONITORING.md`), then load `/admin/analytics` on the deployed frontend and confirm it shows data

## What's NOT handled by this setup

- **Migrations don't run automatically on deploy.** This is deliberate — running schema migrations as a side effect of a serverless build is risky (concurrent deploys, no rollback story). Run `npx prisma migrate deploy` yourself, from a machine with `DIRECT_URL` set, whenever the schema changes.
- **No CI/CD pipeline yet** (tests running before deploy, preview-deploy gating, etc.) — Vercel will happily deploy code that fails `npm test`. Worth adding a GitHub Actions workflow that runs `npm test` in `server/` before merge, once this is being worked on by more than one person.
- **`AI_SERVICE_URL`** — Phase 2 (job matching) isn't built yet; leave unset for now.

## Local development (both apps together)

```bash
# Terminal 1 — Postgres
cd infra && docker compose up -d

# Terminal 2 — backend
cd server
cp .env.example .env   # local values already point at the docker-compose DB
npm install
npx prisma migrate dev --name init
npm run start:dev      # http://localhost:3000

# Terminal 3 — frontend
cd web
cp .env.local.example .env.local
npm install
npm run dev             # http://localhost:3001
```
