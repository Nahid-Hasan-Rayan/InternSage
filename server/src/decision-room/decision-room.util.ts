/**
 * InternSage — Decision Room utilities
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-DECISION-UTIL-001
 * File   : src/decision-room/decision-room.util.ts
 *
 * isoWeekLabel is a deliberate byte-for-byte port of
 * web/src/app/decision-room/page.tsx's getIsoWeekLabel — the
 * frontend buckets a student's own application-velocity chart by
 * the same ISO-week scheme, so if the two ever diverged, "this
 * week" would mean two different things on the same screen. Kept
 * as its own pure function (no NestJS/Prisma imports) so it can be
 * unit-tested in isolation and so the frontend port stays
 * mechanically checkable against this one, not just "similar".
 */

export function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Sort key for period labels like "2026-W33" — plain string compare
 * already sorts these correctly for any single century, but this
 * makes that assumption explicit and named rather than a bare
 * localeCompare() scattered at call sites. */
export function comparePeriods(a: string, b: string): number {
  return a.localeCompare(b);
}
