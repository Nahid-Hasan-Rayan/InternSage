/**
 * InternSage — Landing page
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-FE-LANDING-002
 * File   : src/app/page.tsx
 *
 * Rebuilt from the fact-checked demo HTML (see internsage-landing-fixed.html)
 * — same verified copy and stats, ported into real React components using
 * the app's actual design system and routes, not a static mockup. Every
 * statistic here was independently web-searched and corrected before this
 * page was written; see that file's header comment for sourcing.
 */

"use client";

import Link from "next/link";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { LogoMark } from "@/components/effects/logo-mark";
import { Button } from "@/components/ui/button";

// Lazy-loaded, client-only, and deliberately the ONLY WebGL effect on
// this page — three simultaneous canvases (the original build had
// Strands + SideRays + SoftAurora all running at once) is real,
// avoidable GPU/CPU cost and directly contributed to "the portal
// feels slow." dynamic(..., { ssr: false }) also keeps its JS out of
// the initial bundle entirely until this component actually mounts.
const Strands = dynamic(() => import("@/components/effects/strands"), { ssr: false });
import { Card } from "@/components/ui/card";
import { fadeRise, staggerContainer } from "@/lib/motion";

const STATS = [
  { num: "35.3%", label: "Skill-related underemployment among grads (DOSM, Q4 2025)" },
  { num: "48.6%", label: "Graduates overqualified for their current job (Khazanah Research Institute, 2021)" },
  { num: "5.98M", label: "Malaysian graduates in the workforce (DOSM, 2024)" },
  { num: "RM95B", label: "NIMP 2030 total investment target, 2023–2030" },
];

const PROBLEMS = [
  {
    tag: "Students",
    title: "No feedback, no signal",
    body: "They spend more time tracking portals than preparing for interviews. Rejection emails rarely explain why.",
  },
  {
    tag: "Recruiters",
    title: "Volume without verification",
    body: "Smaller companies are flooded with generic CVs and have no fast way to confirm a claimed skill is real.",
  },
  {
    tag: "Career Centers",
    title: "Spreadsheets, not strategy",
    body: "Universities answer for placement outcomes, yet most still track them through spreadsheets.",
  },
];

const FEATURES = [
  {
    title: "Verified identity",
    body: "Domain-matched university and company accounts — trust that scales without a manual review queue.",
  },
  {
    title: "Explainable matching",
    body: "Every match score comes with matched and missing skills shown — never a bare number nobody can reconstruct.",
  },
  {
    title: "Skill verification",
    body: "A short, timed quiz per claimed skill. Bounded and consented — never ambient monitoring.",
  },
  {
    title: "No-ghosting applications",
    body: "Every status change is real infrastructure, not a UI promise — you always know where you stand.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-paper-50 text-ink-900">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <LogoMark size={36} />
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Register</Link>
          </Button>
        </nav>
      </header>

      <section className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <Strands />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center md:py-28"
        >
        <motion.p variants={fadeRise} className="mono mb-4 text-xs font-medium uppercase tracking-[0.08em] text-signal-600">
          Building Malaysia&rsquo;s talent bridge
        </motion.p>
        <motion.h1
          variants={fadeRise}
          className="serif text-5xl leading-[1.02] tracking-tight md:text-7xl"
        >
          Your skill.
          <br />
          Their need.
        </motion.h1>
        <motion.p variants={fadeRise} className="serif mt-2 text-2xl text-signal-600 md:text-3xl">
          The line between education and employment
        </motion.p>
        <motion.p variants={fadeRise} className="mt-6 max-w-xl text-base text-slate-500">
          InternSage verifies what you can actually do, matches you to real opportunities with the
          reasoning shown, and gives you a plan to close the gap — all in one platform.
        </motion.p>
        <motion.div variants={fadeRise} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started free →</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <a href="/demo.html" target="_blank" rel="noopener noreferrer">
              Explore the live demo ↗
            </a>
          </Button>
        </motion.div>
        <motion.p variants={fadeRise} className="mt-5 text-[13px] text-slate-500">
          No account needed to explore. Free for students, university-verified accounts.
        </motion.p>
        </motion.div>
      </section>

      <section className="border-y border-hairline bg-paper-0">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mono text-3xl font-medium text-signal-700 md:text-4xl">{s.num}</div>
              <div className="mt-2 text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-14 max-w-xl">
          <p className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-signal-600">
            The gap we&rsquo;re closing
          </p>
          <h2 className="serif text-4xl">Three groups, one broken loop</h2>
          <p className="mt-3 text-base text-slate-500">
            Every year, qualified graduates lose out on jobs they were right for — not because they
            lacked skill, but because no one could see it.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <Card key={p.tag} className="p-8">
              <p className="mono mb-4 text-[11px] uppercase tracking-[0.06em] text-slate-500">{p.tag}</p>
              <h3 className="mb-2.5 text-lg font-semibold">{p.title}</h3>
              <p className="text-sm text-slate-500">{p.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="bg-paper-100 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 max-w-xl">
            <p className="mono mb-3 text-xs font-medium uppercase tracking-[0.08em] text-signal-600">
              What makes it work
            </p>
            <h2 className="serif text-4xl">Built, not mocked up</h2>
            <p className="mt-3 text-base text-slate-500">
              One platform, not separate tools — every feature below is live in the app today, not a
              roadmap slide.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-8">
                <h3 className="mb-2.5 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="serif text-4xl">Ready to close your own gap?</h2>
        <p className="mx-auto mt-3 max-w-md text-base text-slate-500">
          Register free as a student, or bring your team on as a recruiter.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Register free</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-hairline px-6 py-8 text-center text-xs text-slate-500">
        InternSage — verified internship matching for Malaysia.
      </footer>
    </main>
  );
}
