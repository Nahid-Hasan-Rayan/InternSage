// © 2026 Nahid Hasan Rayan. All rights reserved.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
// The backend sets a global prefix (`app.setGlobalPrefix('api')` in
// main.ts) — every route actually lives under /api/..., not at the
// root. Centralized here so this can't drift out of sync per-call.
export const API_BASE = `${API_URL}/api`;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "RECRUITER" | "ADMIN" | "UNIVERSITY";
  verified: boolean;
}

/**
 * Where a freshly logged-in/registered user should land, by role.
 * Single source of truth — login and register both call this so the
 * destination can never drift out of sync between the two flows.
 * STUDENT goes to /profile deliberately (a one-time nudge to fill it
 * in before the rest of the app leans on that data); every other
 * role goes to a real dashboard, not a route that doesn't exist.
 */
export function landingRouteFor(role: SessionUser["role"]): string {
  switch (role) {
    case "STUDENT":
      return "/profile";
    case "ADMIN":
      return "/admin/analytics";
    case "UNIVERSITY":
      return "/university/dashboard";
    case "RECRUITER":
    default:
      return "/dashboard";
  }
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? "Something went wrong. Please try again.");
    throw new Error(message);
  }
  return body as T;
}

// `credentials: "include"` on every call is what makes the httpOnly
// session cookie actually get sent — without it, the browser won't
// attach a cross-origin cookie even though the backend set one.
// There is deliberately no token stored or read anywhere in this
// file: an httpOnly cookie can't be touched by JavaScript at all,
// which is the point — it closes off the XSS-exposure a
// localStorage-stored token would have.

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const result = await handle<{ user: SessionUser }>(res);
  cacheSession(result.user);
  return result;
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  role: "STUDENT" | "RECRUITER" | "ADMIN" | "UNIVERSITY";
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const result = await handle<{ user: SessionUser }>(res);
  cacheSession(result.user);
  return result;
}

export async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  const result = await handle<{ loggedOut: boolean }>(res);
  sessionCache = null;
  return result;
}

/**
 * Every page on the site resolves its own session by calling this on
 * mount by design, so no page ever trusts
 * stale client state over the httpOnly cookie. The cost of that was
 * a real one: every single navigation re-hit GET /auth/me and sat in
 * a "Loading…" state with no sidebar until it came back, so the
 * whole shell visibly flashed on every click. That network call is
 * genuinely redundant within one browser session — the cookie can't
 * change without a login/logout, both of which already run through
 * this file — so the fix lives here, once, rather than adding a
 * SessionProvider context that every one of ~19 pages would need to
 * be rewired to consume. First call still does the real fetch;
 * every call after that resolves from cache, instantly, so the shell
 * stops disappearing between pages. login/register/logout above all
 * keep this in sync so no one is ever a stale user for even one
 * navigation.
 */
let sessionCache: Promise<SessionUser | null> | null = null;

function cacheSession(user: SessionUser) {
  sessionCache = Promise.resolve(user);
}

/** Resolves the current session from the httpOnly cookie — returns null (not a thrown error) when logged out, so pages can redirect quietly. Cached per browser session; see the note above cacheSession. */
export async function getSession(): Promise<SessionUser | null> {
  if (sessionCache) return sessionCache;
  sessionCache = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      if (!res.ok) {
        sessionCache = null;
        return null;
      }
      const body = await res.json();
      return body.user as SessionUser;
    } catch {
      sessionCache = null;
      return null;
    }
  })();
  return sessionCache;
}

/** Use for any authenticated call — attaches the session cookie automatically. */
export async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  return handle<T>(res);
}
