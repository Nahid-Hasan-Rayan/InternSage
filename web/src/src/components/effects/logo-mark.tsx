"use client";

import { motion } from "motion/react";
import { EASE } from "@/lib/motion";

interface LogoMarkProps {
  size?: number;
  showWordmark?: boolean;
}

/**
 * The InternSage mark: a calibrating dial that sweeps from empty to a
 * settled reading on mount, then holds — the same visual language as
 * the match-score gauges used throughout the product, so the logo
 * itself teaches the user what to expect before they've seen a score.
 */
export function LogoMark({ size = 40, showWordmark = true }: LogoMarkProps) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-signal-700)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * 0.22 }}
          transition={{ duration: 1.1, ease: EASE.out, delay: 0.15 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={1.6}
          fill="var(--color-signal-700)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: DURATION_SPRING }}
          style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
        />
      </svg>
      {showWordmark && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE.out, delay: 0.3 }}
          className="font-display text-[19px] font-bold text-signal-700 tracking-tight"
        >
          InternSage
        </motion.span>
      )}
    </div>
  );
}

const DURATION_SPRING = 0.5;
