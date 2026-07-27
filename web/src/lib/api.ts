const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
// The backend sets a global prefix (`app.setGlobalPrefix('api')` in
// main.ts) — every route actually lives under /api/..., not at the
// root. Centralized here so this can't drift out of sync per-call.
const API_BASE = `${API_URL}/api`;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "RECRUITER";
  verified: boolean;
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
  return handle<{ user: SessionUser }>(res);
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  role: "STUDENT" | "RECRUITER";
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handle<{ user: SessionUser }>(res);
}

export async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return handle<{ loggedOut: boolean }>(res);
}

/** Resolves the current session from the httpOnly cookie — returns null (not a thrown error) when logged out, so pages can redirect quietly. */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    if (!res.ok) return null;
    const body = await res.json();
    return body.user as SessionUser;
  } catch {
    return null;
  }
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
