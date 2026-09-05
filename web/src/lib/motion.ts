// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * Motion tokens — one shared vocabulary for every animation in the app.
 * Research basis: never `ease-in` for entrances (reads as sluggish — the
 * slow start delays the exact moment being watched), stay under ~300ms
 * for interactive feedback, use a slight spring overshoot for anything
 * meant to feel physical (button presses, the logo mark), and keep the
 * same handful of curves everywhere rather than inventing a new one per
 * component — a consistent duration/curve is what reads as "designed"
 * rather than "assembled."
 */

export const EASE = {
  /** Entrances: cards, modals, page content arriving. Strong deceleration. */
  out: [0.23, 1, 0.32, 1] as const,
  /** State changes: tab switches, toggles, anything transitioning between two settled states. */
  inOut: [0.77, 0, 0.175, 1] as const,
  /** Physical feedback: button presses, the logo mark, anything that should feel like it has weight. */
  spring: [0.34, 1.56, 0.64, 1] as const,
};

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  gauge: 0.8,
};

/** Shared variants for framer/motion's `variants` prop. */
export const fadeRise = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.out },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};
