// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MatchGauge
 *
 * The Master Blueprint calls this out specifically: "the radial dial
 * gauge — used for every score in the system (match %, authenticity,
 * placement rate, interview results). One motif, reused everywhere,
 * rather than five different chart types competing for attention.
 * This is where the design's boldness budget is spent." It existed
 * in the demo HTML's hero card but was never built as a real,
 * reusable component — this is that component.
 *
 * Deliberately animates in on mount (arc draws from 0 to the actual
 * value) rather than appearing instantly — same "calibrating"
 * language as LogoMark, so a score always reads as a real
 * measurement settling into place, not a static number.
 */

"use client";

import { motion } from "motion/react";
import { EASE } from "@/lib/motion";

interface MatchGaugeProps {
  /** 0-100 */
  value: number;
  size?: number;
  /** Small label under the number, e.g. "match" or "authenticity" */
  label?: string;
  /** Below the pass threshold reads in alert color instead of signal-green */
  warnBelow?: number;
}

export function MatchGauge({ value, size = 88, label, warnBelow }: MatchGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const strokeWidth = size * 0.09;
  const r = size / 2 - strokeWidth;
  const c = 2 * Math.PI * r;
  const isWarn = typeof warnBelow === "number" && clamped < warnBelow;
  const color = isWarn ? "var(--color-alert-600)" : "var(--color-signal-700)";

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: EASE.out, delay: 0.1 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="mono"
          style={{ fontSize: size * 0.26, fontWeight: 600, fill: "var(--color-ink-900)" }}
        >
          {Math.round(clamped)}
        </text>
      </svg>
      {label && <span className="mt-1 text-xs text-slate-500">{label}</span>}
    </div>
  );
}
