"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

type TrailPoint = {
  id: number;
  x: number;
  y: number;
};

interface ImageTrailProps {
  /** Optional image URLs. Falls back to a brass "reading mark" dot when omitted,
   *  which fits InternSage's instrument identity better than a random stock image. */
  images?: string[];
  /** Minimum distance (px) the cursor must move before a new trail point spawns. */
  spawnDistance?: number;
  /** How long each trail point stays before fading out, in ms. */
  lifespan?: number;
}

/**
 * A real, working cursor trail — not a scripted preview. Spawns a new point as the
 * cursor moves past `spawnDistance`, each one fades and scales down over `lifespan`.
 * Respects prefers-reduced-motion by not rendering at all in that case.
 */
export function ImageTrail({
  images,
  spawnDistance = 40,
  lifespan = 700,
}: ImageTrailProps) {
  const [points, setPoints] = React.useState<TrailPoint[]>([]);
  const lastPos = React.useRef<{ x: number; y: number } | null>(null);
  const idRef = React.useRef(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;

    function handleMove(e: MouseEvent) {
      const { clientX: x, clientY: y } = e;
      const last = lastPos.current;
      const dist = last ? Math.hypot(x - last.x, y - last.y) : Infinity;
      if (dist < spawnDistance) return;
      lastPos.current = { x, y };
      const id = idRef.current++;
      setPoints((prev) => [...prev.slice(-14), { id, x, y }]);
      window.setTimeout(() => {
        setPoints((prev) => prev.filter((p) => p.id !== id));
      }, lifespan);
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reducedMotion, spawnDistance, lifespan]);

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <AnimatePresence>
        {points.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: lifespan / 1000, ease: [0.16, 1, 0.3, 1] }}
            style={{ left: p.x, top: p.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            {images && images.length > 0 ? (
              <img
                src={images[p.id % images.length]}
                alt=""
                className="h-10 w-10 rounded-[3px] border border-signal-600/50 object-cover shadow-lg"
              />
            ) : (
              <span className="block h-2.5 w-2.5 rounded-full border border-signal-600 bg-signal-700/30" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
