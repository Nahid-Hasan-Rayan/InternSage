/**
 * InternSage — DecisionRoomService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-DECISION-SVC-001
 * File   : src/decision-room/decision-room.service.ts
 *
 * Two very different kinds of "trend" live behind one endpoint, and
 * they're deliberately computed differently:
 *
 *   - Skill demand is real, derived entirely from InternSage's own
 *     JobPosting/JobRequiredSkill rows (never fabricated, never
 *     scraped-without-attribution). It's batch-computed weekly by
 *     recomputeSkillDemand (internal cron route only) and stored in
 *     SkillDemandSnapshot — getTrends() only ever reads what was
 *     last computed, same discipline as MatchingService.recompute
 *     vs getMatchesForStudent. Early on, with few postings on the
 *     platform, these numbers will be small — that's honest, not
 *     something to inflate.
 *
 *   - Salary bands are the opposite: NOT computable from this
 *     platform's still-thin posting volume, so they're curated,
 *     source-attributed reference rows (see prisma/seed.ts) read
 *     directly — no aggregation step needed for those.
 *
 * Insights are the third, unrelated thing this module serves: short,
 * per-student notes computed live (cheap, single-user scope, always
 * fresh) from the student's OWN applications/matches/CV — never
 * cohort-comparative (no baseline exists yet to compare against
 * honestly) and never LLM-generated (deterministic templates only,
 * same "never invent the underlying fact" principle CopilotService
 * applies to its own narration).
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { isoWeekLabel, comparePeriods } from './decision-room.util';

export interface TrendPoint {
  period: string;
  value: number;
}

export interface SkillDemandTrend {
  skillName: string;
  points: TrendPoint[];
  changePct: number;
}

export interface SalaryBand {
  role: string;
  region: string;
  p25: number;
  median: number;
  p75: number;
}

export interface DecisionRoomTrends {
  skillDemand: SkillDemandTrend[];
  salaryBands: SalaryBand[];
  updatedAt: string;
}

export interface DecisionRoomInsight {
  id: string;
  text: string;
  tone: 'positive' | 'neutral' | 'attention';
}

/** How many of the most-recent weekly snapshots to return per skill
 * — bounded so the trend chart never has to render an unbounded
 * history, independent of how far back recomputeSkillDemand's own
 * retention (§ pruneOldSnapshots) happens to go. */
const MAX_POINTS_PER_SKILL = 8;

/** How many skills (ranked by most recent posting count) to include
 * in the response. The frontend itself only charts the top 4, but
 * returning a few more here means that slice can grow without a
 * backend change. */
const MAX_SKILLS_RETURNED = 8;

/** Snapshots older than this are pruned on every recompute run —
 * plain storage hygiene, not a business rule; nothing currently
 * reads snapshots this old. */
const SNAPSHOT_RETENTION_DAYS = 180;

@Injectable()
export class DecisionRoomService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------
  // Batch: skill demand (internal cron only — see controller)
  // ---------------------------------------------------------------

  async recomputeSkillDemand(): Promise<{ period: string; skillsProcessed: number }> {
    const period = isoWeekLabel(new Date());

    const requiredSkillRows = await this.prisma.jobRequiredSkill.findMany({
      where: { jobPosting: { isActive: true } },
      select: { skillId: true },
    });

    const counts = new Map<string, number>();
    for (const row of requiredSkillRows) {
      counts.set(row.skillId, (counts.get(row.skillId) ?? 0) + 1);
    }

    for (const [skillId, postingCount] of counts.entries()) {
      await this.prisma.skillDemandSnapshot.upsert({
        where: { skillId_period: { skillId, period } },
        create: { skillId, period, postingCount },
        update: { postingCount, computedAt: new Date() },
      });
    }

    await this.pruneOldSnapshots();

    return { period, skillsProcessed: counts.size };
  }

  private async pruneOldSnapshots(): Promise<void> {
    const cutoff = new Date(Date.now() - SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.skillDemandSnapshot.deleteMany({ where: { computedAt: { lt: cutoff } } });
  }

  // ---------------------------------------------------------------
  // Read: GET /decision-room/trends
  // ---------------------------------------------------------------

  async getTrends(): Promise<DecisionRoomTrends> {
    const [snapshots, salaryBenchmarks] = await Promise.all([
      this.prisma.skillDemandSnapshot.findMany({
        include: { skill: { select: { name: true } } },
        orderBy: { period: 'asc' },
      }),
      this.prisma.salaryBenchmark.findMany({ orderBy: { role: 'asc' } }),
    ]);

    const bySkill = new Map<string, { skillName: string; points: TrendPoint[] }>();
    for (const row of snapshots) {
      const key = row.skillId;
      if (!bySkill.has(key)) {
        bySkill.set(key, { skillName: row.skill.name, points: [] });
      }
      bySkill.get(key)!.points.push({ period: row.period, value: row.postingCount });
    }

    const skillDemand: SkillDemandTrend[] = Array.from(bySkill.values())
      .map((entry) => {
        const points = entry.points
          .sort((a, b) => comparePeriods(a.period, b.period))
          .slice(-MAX_POINTS_PER_SKILL);
        const latest = points[points.length - 1]?.value ?? 0;
        const previous = points.length > 1 ? points[points.length - 2].value : latest;
        const changePct = previous === 0 ? (latest > 0 ? 100 : 0) : Math.round(((latest - previous) / previous) * 100);
        return { skillName: entry.skillName, points, changePct };
      })
      // Ranked by current demand, not alphabetically — the whole
      // point is surfacing what's hot right now.
      .sort((a, b) => (b.points[b.points.length - 1]?.value ?? 0) - (a.points[a.points.length - 1]?.value ?? 0))
      .slice(0, MAX_SKILLS_RETURNED);

    const salaryBands: SalaryBand[] = salaryBenchmarks.map(
      (b: { role: string; region: string; p25: number; median: number; p75: number }) => ({
        role: b.role,
        region: b.region,
        p25: b.p25,
        median: b.median,
        p75: b.p75,
      }),
    );

    const snapshotTimestamps = snapshots.map((s: { computedAt: Date }) => s.computedAt.getTime());
    const benchmarkTimestamps = salaryBenchmarks.map((b: { updatedAt: Date }) => b.updatedAt.getTime());
    const allTimestamps = [...snapshotTimestamps, ...benchmarkTimestamps];
    const updatedAt = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)).toISOString() : new Date().toISOString();

    return { skillDemand, salaryBands, updatedAt };
  }

  // ---------------------------------------------------------------
  // Read: GET /decision-room/insights (per-student, live, cheap)
  // ---------------------------------------------------------------

  async getInsightsForStudent(userId: string): Promise<DecisionRoomInsight[]> {
    const studentProfile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) {
      // Every STUDENT gets a StudentProfile row at registration
      // (see AuthService.register's transaction) — this should
      // never happen in practice, but an insights page has nothing
      // honest to say about a profile that doesn't exist.
      return [];
    }

    const [professionalProfile, applications, matches] = await Promise.all([
      this.prisma.professionalProfile.findUnique({
        where: { userId },
        include: { skills: true },
      }),
      this.prisma.application.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.matchScore.findMany({
        where: { studentProfileId: studentProfile.id },
        orderBy: { computedAt: 'asc' },
      }),
    ]);

    const insights: DecisionRoomInsight[] = [];

    const verificationInsight = this.buildVerificationInsight(professionalProfile?.skills ?? []);
    if (verificationInsight) insights.push(verificationInsight);

    const trendInsight = this.buildMatchTrendInsight(matches);
    if (trendInsight) insights.push(trendInsight);

    const gapInsight = this.buildSkillGapInsight(matches);
    if (gapInsight) insights.push(gapInsight);

    const momentumInsight = this.buildMomentumInsight(applications, matches);
    if (momentumInsight) insights.push(momentumInsight);

    return insights;
  }

  private buildVerificationInsight(
    skills: Array<{ verified: boolean }>,
  ): DecisionRoomInsight | null {
    const total = skills.length;
    if (total === 0) return null;

    const verified = skills.filter((s) => s.verified).length;
    if (verified === total) {
      return {
        id: 'verification',
        text: `All ${total} of your claimed skills are verified — recruiters see your strongest possible profile.`,
        tone: 'positive',
      };
    }

    const unverified = total - verified;
    return {
      id: 'verification',
      text: `${unverified} of your ${total} claimed skill${total === 1 ? '' : 's'} ${unverified === 1 ? 'is' : 'are'} still unverified — verifying ${unverified === 1 ? 'it' : 'them'} can raise your match scores.`,
      tone: 'attention',
    };
  }

  private buildMatchTrendInsight(
    matches: Array<{ score: number }>,
  ): DecisionRoomInsight | null {
    if (matches.length < 2) return null;

    const latest = matches[matches.length - 1].score;
    const priorScores = matches.slice(0, -1).map((m) => m.score);
    const priorAvg = priorScores.reduce((sum, s) => sum + s, 0) / priorScores.length;
    const diff = Math.round(latest - priorAvg);

    if (diff >= 5) {
      return {
        id: 'match-trend',
        text: `Your most recent match score (${latest}) is ${diff} points above your earlier average — your profile is trending up.`,
        tone: 'positive',
      };
    }
    if (diff <= -5) {
      return {
        id: 'match-trend',
        text: `Your most recent match score (${latest}) is ${Math.abs(diff)} points below your earlier average — worth reviewing what changed.`,
        tone: 'attention',
      };
    }
    const allAvg = Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length);
    return {
      id: 'match-trend',
      text: `Your match scores have stayed steady, averaging ${allAvg} across your last ${matches.length} computed matches.`,
      tone: 'neutral',
    };
  }

  private buildSkillGapInsight(
    matches: Array<{ missingSkills: unknown }>,
  ): DecisionRoomInsight | null {
    if (matches.length === 0) return null;

    const counts = new Map<string, number>();
    for (const match of matches) {
      const missing = Array.isArray(match.missingSkills) ? (match.missingSkills as unknown[]) : [];
      for (const skill of missing) {
        if (typeof skill !== 'string') continue;
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      }
    }
    if (counts.size === 0) return null;

    const [topSkill, count] = Array.from(counts.entries()).sort(([, a], [, b]) => b - a)[0];
    return {
      id: 'skill-gap',
      text: `"${topSkill}" is your most common skill gap, appearing in ${count} of ${matches.length} computed matches — closing it could unlock more matches.`,
      tone: 'attention',
    };
  }

  private buildMomentumInsight(
    applications: Array<{ createdAt: Date }>,
    matches: Array<unknown>,
  ): DecisionRoomInsight | null {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentCount = applications.filter((a) => a.createdAt.getTime() >= twoWeeksAgo).length;

    if (recentCount > 0) {
      return {
        id: 'momentum',
        text: `You've applied to ${recentCount} role${recentCount === 1 ? '' : 's'} in the last 2 weeks — good momentum.`,
        tone: 'positive',
      };
    }
    if (applications.length > 0) {
      return {
        id: 'momentum',
        text: `No new applications in the last 2 weeks — consider revisiting your matches.`,
        tone: 'attention',
      };
    }
    if (matches.length > 0) {
      return {
        id: 'momentum',
        text: `You have ${matches.length} computed match${matches.length === 1 ? '' : 'es'} but no applications yet — applying to your top match is the next step.`,
        tone: 'attention',
      };
    }
    return null;
  }
}
