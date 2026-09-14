// © 2026 Nahid Hasan Rayan. All rights reserved.

"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export interface EvidenceSkill {
  skillId: string;
  skill: { name: string; category: string };
  verified: boolean;
  authenticityScore: number | null;
  authenticityUpdatedAt: string | null;
}

function confidenceTier(score: number | null, verified: boolean): "high" | "med" | "low" | "none" {
  if (!verified || score == null) return "none";
  if (score >= 80) return "high";
  if (score >= 60) return "med";
  return "low";
}

const TIER_STYLES: Record<string, string> = {
  high: "bg-[#7fd9a0]/15 text-[#7fd9a0]",
  med: "bg-[#e6b45a]/15 text-[#e6b45a]",
  low: "bg-white/10 text-[#a0a0aa]",
  none: "bg-white/[0.06] text-[#7f9689]",
};

function formatAgo(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function EvidencePassport({
  name,
  skills,
}: {
  name: string;
  skills: EvidenceSkill[];
}) {
  const verifiedCount = skills.filter((s) => s.verified).length;

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-card)] px-6 py-6 text-[#eef1ee]"
      style={{
        background: "#0d1a14",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "100% 32px",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mono mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-[#8fb89f]">
            <ShieldCheck className="h-3 w-3" />
            Evidence passport
          </p>
          <h3 className="font-display text-2xl font-normal">{name || "Your evidence"}</h3>
        </div>
        <span className="mono shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-[#a9c4b3]">
          {verifiedCount}/{skills.length || 0} verified
        </span>
      </div>

      {skills.length === 0 ? (
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-[#a9c4b3]">
          No claims logged yet. Add a skill below, then verify it to start this ledger.
        </p>
      ) : (
        <div className="mt-4 border-t border-white/10">
          <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.9fr] gap-3 py-2 text-[10px] uppercase tracking-[0.05em] text-[#7f9689]">
            <span>Skill</span>
            <span>Category</span>
            <span>Score</span>
            <span>Checked</span>
          </div>
          {skills.map((s) => {
            const tier = confidenceTier(s.authenticityScore, s.verified);
            return (
              <div
                key={s.skillId}
                className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.9fr] items-center gap-3 border-t border-white/[0.08] py-2.5 text-[12.5px]"
              >
                <span className="font-medium text-[#eef1ee]">{s.skill.name}</span>
                <span className="text-[#a9c4b3]">{s.skill.category}</span>
                <span
                  className={`mono inline-block w-fit rounded px-2 py-0.5 text-[11px] font-semibold ${TIER_STYLES[tier]}`}
                >
                  {s.verified && s.authenticityScore != null ? `${s.authenticityScore}%` : "self-reported"}
                </span>
                <span className="mono text-[11px] text-[#7f9689]">
                  {s.verified ? formatAgo(s.authenticityUpdatedAt) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 border-t border-white/10 pt-3.5 text-[12px] italic text-[#a9c4b3]">
        This is what recruiters see instead of a claim they have to take on faith.
        {verifiedCount < skills.length && (
          <>
            {" "}
            <Link href="/verification" className="not-italic text-[#7fd9a0] hover:underline">
              Verify {skills.length - verifiedCount} more →
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export default EvidencePassport;
