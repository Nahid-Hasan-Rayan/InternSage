// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — TemplateReplyGenerator
 *
 * No network call, no API key required — OpenRouterReplyGenerator's
 * actual fallback, and what runs Sage end-to-end with zero budget or
 * during an OpenRouter outage, same role RuleBasedIntentParser plays
 * one layer upstream. Composed entirely from the CopilotContext's
 * `data` field — nothing here is ever invented, only assembled from
 * numbers/names that are already there.
 */

import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReplyGenerator, CopilotContext } from './reply-generator.interface';
import { TEMPLATE_OPENERS } from '../sage-persona';

@Injectable()
export class TemplateReplyGenerator implements ReplyGenerator {
  readonly name = 'template';

  async generate(context: CopilotContext): Promise<string> {
    const opener = TEMPLATE_OPENERS[Math.floor(Math.random() * TEMPLATE_OPENERS.length)];
    switch (context.role) {
      case Role.RECRUITER:
        return this.recruiterReply(opener, context);
      case Role.STUDENT:
        return this.studentReply(opener, context);
      case Role.UNIVERSITY:
        return this.universityReply(opener, context);
      default:
        return "I didn't find anything I can ground an answer in for that question.";
    }
  }

  private recruiterReply(opener: string, context: CopilotContext): string {
    const candidates = (context.data.candidates ?? []) as Array<{
      major: string | null;
      year: number | null;
      universityName?: string;
    }>;
    const poolSize = (context.data.poolSize as number) ?? 0;

    if (poolSize === 0) {
      return "Nobody's applied to your postings yet, so there's no pool for me to search. Once candidates start applying I can filter them by skill, major, year, or authenticity score.";
    }
    if (candidates.length === 0) {
      return `${opener} none of the ${poolSize} candidate${poolSize === 1 ? '' : 's'} in your applicant pool matches that. Try loosening a filter — a broader skill list or dropping the year requirement usually surfaces someone.`;
    }
    const lines = candidates
      .slice(0, 5)
      .map((c) => `- ${c.major ?? 'Undeclared major'}, Year ${c.year ?? '?'}${c.universityName ? ` · ${c.universityName}` : ''}`)
      .join('\n');
    const more = candidates.length > 5 ? `\n…and ${candidates.length - 5} more.` : '';
    return `${opener} ${candidates.length} of your ${poolSize} applicant${poolSize === 1 ? '' : 's'} match that.\n${lines}${more}`;
  }

  private studentReply(opener: string, context: CopilotContext): string {
    const applications = (context.data.applications ?? []) as Array<{
      title: string;
      company: string;
      status: string;
    }>;
    const matches = (context.data.matches ?? []) as Array<{
      title: string;
      company: string;
      score: number;
      missingSkills: string[];
    }>;
    const unverifiedSkills = (context.data.unverifiedSkills ?? []) as string[];

    if (applications.length === 0 && matches.length === 0) {
      return "You haven't applied anywhere yet and I don't have any computed matches for you. Fill in your CV and run a match recompute — that's what I'll ground answers in from there.";
    }

    const parts: string[] = [opener];
    if (applications.length > 0) {
      const byStatus = new Map<string, number>();
      for (const a of applications) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
      const statusLine = Array.from(byStatus.entries())
        .map(([status, count]) => `${count} ${status.toLowerCase().replace('_', ' ')}`)
        .join(', ');
      parts.push(`You have ${applications.length} application${applications.length === 1 ? '' : 's'} out (${statusLine}).`);
    }
    if (matches.length > 0) {
      const top = matches[0];
      parts.push(
        `Your strongest computed match is ${top.title} at ${top.company} (${top.score}/100)${
          top.missingSkills.length > 0 ? ` — you're missing ${top.missingSkills.slice(0, 3).join(', ')}.` : '.'
        }`,
      );
    }
    if (unverifiedSkills.length > 0) {
      parts.push(`${unverifiedSkills.length} skill${unverifiedSkills.length === 1 ? '' : 's'} on your CV (${unverifiedSkills.slice(0, 3).join(', ')}) aren't verified yet — that's usually what's capping your match scores.`);
    }
    return parts.join(' ');
  }

  private universityReply(opener: string, context: CopilotContext): string {
    const stats = context.data.stats as
      | { placementRatePct: number; studentsPlacedYtd: number; activePartners: number; upcomingEvents: number }
      | undefined;
    const topCompanies = (context.data.topCompanies ?? []) as Array<{ name: string; hires: number }>;
    const recentActivity = (context.data.recentActivity ?? []) as string[];

    if (!stats) {
      return "I don't have a cohort loaded for your account yet — once students from your university start registering, I can brief you on placement rate, top employers, and programme-level outcomes.";
    }

    const parts: string[] = [
      `${opener} placement rate is ${stats.placementRatePct}% across your cohort, with ${stats.studentsPlacedYtd} student${stats.studentsPlacedYtd === 1 ? '' : 's'} placed this year.`,
    ];
    if (topCompanies.length > 0) {
      parts.push(`Top hiring partner right now: ${topCompanies[0].name} (${topCompanies[0].hires} hire${topCompanies[0].hires === 1 ? '' : 's'}).`);
    }
    if (recentActivity.length > 0) {
      parts.push(recentActivity[0]);
    }
    parts.push(`${stats.activePartners} active partner${stats.activePartners === 1 ? '' : 's'}, ${stats.upcomingEvents} event${stats.upcomingEvents === 1 ? '' : 's'} coming up.`);
    return parts.join(' ');
  }
}
