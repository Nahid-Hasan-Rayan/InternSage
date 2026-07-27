# InternSage Backend — Architecture & How to Extend It

**Author:** Nahid Hasan Rayan

This file is the map for adding the next feature without breaking what's already here. Read this before starting Phase 2.

## The pattern every module follows

Auth, Profile, and CV are all shaped identically — copy whichever is closest to your new feature and adapt it:

```
src/<feature>/
  <feature>.module.ts        # wires controller + service, exported for reuse
  <feature>.controller.ts    # HTTP layer only — no business logic here
  <feature>.service.ts       # all business logic; takes userId, never a raw request
  dto/
    *.dto.ts                 # class-validator decorated — this is your input firewall
```

**Rules that keep this safe as it grows:**

1. **A service method never trusts a client-supplied ID for "whose record is this."** Every read/write resolves ownership from `@CurrentUser()` first (see `profile.service.ts` / `cv.service.ts`). If you're tempted to accept an `:id` param for "get my own X," stop — resolve it from the authenticated user instead.
2. **Every new route is protected by default.** The global `JwtAuthGuard` requires a valid token unless you explicitly add `@Public()`. If a new endpoint should be public, that has to be a visible, deliberate decision in the code — never a default.
3. **Every DTO gets `class-validator` decorators**, even if it feels like overkill for a small field. The global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`) means an undecorated or missing field is silently stripped or the whole request rejected — decorate it or the feature won't work, by design.
4. **Register the module in exactly one place:** `app.module.ts`'s `imports` array. Nothing else needs to know a new module exists.

## Adding Phase 2 (job aggregation, matching, trust & verification)

Per the Build Plan, in this order:

1. Add `JobPosting`, `MatchScore`, `VerificationSession` models to `prisma/schema.prisma`, run `npx prisma migrate dev --name phase-2`.
2. New `job-aggregator/` module — adapter interface pattern (`JobSourceAdapter`), one legitimate RSS/API adapter before any scraping fallback.
3. New `matching/` module — calls the AI service's `/embed` endpoint (server-side only, via `AI_SERVICE_URL` + `AI_SERVICE_INTERNAL_KEY`, already in `.env.example`), stores vectors via a raw SQL migration (Prisma doesn't model `pgvector` columns natively yet).
4. New `verification/` module — same ownership-scoping discipline as `cv.service.ts`.

## Testing convention

`auth.service.spec.ts` is the template: mock `@prisma/client` at the top of the file, construct the service directly with mocked dependencies (no need for Nest's `TestingModule` machinery for a plain service), and prioritize testing the branches that protect trust or money — not blanket coverage for its own sake.

## What NOT to do

- Don't add a second place that reads `process.env` directly for config — extend `src/config/env.validation.ts` instead, so a missing/malformed variable still fails fast at boot with a clear message.
- Don't call the AI service (or any external AI provider) from anywhere other than a backend service class, server-side. Never from a DTO, never from anything a future frontend could bypass.
