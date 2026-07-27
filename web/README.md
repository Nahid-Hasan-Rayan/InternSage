# InternSage — Frontend

Next.js 16 (App Router) + Tailwind v4 + hand-built shadcn-style primitives (see note below) + `motion` for animation.

## What's here

- `/` — landing page with the real cursor image-trail effect active
- `/login`, `/register` — real forms wired to the NestJS backend's `/auth/login` and `/auth/register`, with the animated logo mark, staggered entrance, and animated error states
- `src/components/effects/logo-mark.tsx` — the calibrating-dial logo animation
- `src/components/effects/image-trail.tsx` — the cursor trail, a real working component (respects `prefers-reduced-motion` by not rendering at all)
- `src/lib/motion.ts` — the shared easing/duration tokens every animation in the app draws from, so motion feels consistent rather than assembled per-component
- `src/components/ui/` — Button, Input, Label, Card in the exact pattern `shadcn add` would generate

## Running it

```bash
cd frontend
pnpm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your running backend
pnpm dev
```

Open http://localhost:3001 (or whatever port it prints) — the backend from `internsage-backend-phase1` needs to be running on the URL you set in `.env.local` for login/register to actually complete.

## On `components.json` and real `shadcn add`

`ui.shadcn.com` isn't reachable from Claude's sandbox network, so `shadcn init`/`shadcn add` couldn't run here, same category of restriction as the Prisma binary issue in the backend. I hand-wrote `components.json` and the primitives in the exact shape the CLI would have produced, so on your own machine, real `shadcn add <component>` commands will work normally and slot in cleanly alongside what's already here (it'll recognize the existing config instead of re-initializing).

The same restriction applies to `@skiper-ui/skiper6` specifically, that registry is unreachable from here too. What you have instead is a hand-built equivalent: `ImageTrail` does the same job (a real cursor trail, not a mock), built on the same underlying animation library (`motion`, formerly Framer Motion) Skiper UI itself is built on. If you get the real Skiper component working locally later, swapping it in is a drop-in replacement, same effect, upstream-maintained version.

## Verification actually run in this environment

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors |
| `pnpm build` (production build, Turbopack) | ✅ Succeeds, verified with Google Fonts temporarily swapped for system fonts, see below |
| All 3 routes (`/`, `/login`, `/register`) prerender | ✅ Confirmed in build output |
| A real bug caught and fixed before delivery | The `loading` prop added to `Button` initially broke `asChild` composition with Radix's `Slot` (which requires exactly one child; the conditional spinner added a second, falsy one even when not loading). Fixed by branching the render path instead of injecting a spinner unconditionally. |

**One thing not verifiable end-to-end here:** `next/font/google` fetches font files from `fonts.googleapis.com` at build time, also unreachable from this sandbox. Unlike the Prisma and shadcn restrictions, this is a completely standard, universally-reachable domain, it resolves normally the first time `pnpm build` or `pnpm dev` runs on an ordinary machine, nothing to configure. To confirm nothing else was broken, the full production build was run with the fonts temporarily stripped out, confirmed clean end to end, then the real `Sora` / `IBM Plex Sans` / `IBM Plex Mono` setup was restored before packaging this.
