// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — frontend analytics client
 *
 * Deliberately thin: forwards deliberate product events to the
 * backend's POST /api/analytics/event (see AnalyticsController on
 * the backend), which requires a logged-in session — page views from
 * anonymous visitors are NOT tracked here, since that needs a
 * different tool (see note below).
 *
 * This is proprietary product telemetry ("did this student finish
 * their profile") — for session recording, funnels, and anonymous
 * traffic analytics, wire up a dedicated product-analytics tool
 * instead of extending this file. Recommended: PostHog or Plausible
 * — see docs/MONITORING.md for a short comparison and setup notes.
 * Don't reinvent that here.
 */

import { authedFetch } from "./api";

export type AnalyticsEventType = "PROFILE_UPDATED" | "CV_UPDATED";

/**
 * Fire-and-forget by design — a failed analytics call must never
 * interrupt or delay whatever the user was actually doing. Errors
 * are swallowed silently (not even logged to the console in
 * production) rather than surfaced anywhere in the UI.
 */
export function trackEvent(type: AnalyticsEventType, metadata?: Record<string, unknown>): void {
  void authedFetch("/analytics/event", {
    method: "POST",
    body: JSON.stringify({ type, metadata }),
  }).catch(() => {
    // Intentionally swallowed — see file header.
  });
}
