// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CopilotService (Sage Copilot)
 *
 * Grounded, not freeform, on two separate axes:
 *   1. What Sage is allowed to search for. A question never becomes
 *      a raw or string-built query — it becomes a CopilotIntent (a
 *      fixed set of optional fields, see intent-parser.interface.ts)
 *      and the intent becomes exactly one Prisma query, built here.
 *   2. What Sage is allowed to say. The reply generator (OpenRouter
 *      or the offline template fallback, see reply-generator/) only
 *      ever receives a pre-computed CopilotContext.data object —
 *      already role-scoped, already filtered — never a live query
 *      surface. A model hallucinating a candidate that doesn't exist
 *      is structurally impossible: it can only talk about rows this
 *      service already decided to hand it.
 *
 * Available to STUDENT, RECRUITER, and UNIVERSITY — not
 * RECRUITER-only as the module started out. The candidate-search
 * behaviour is still recruiter-specific (scoped to their own
 * applicant pool only, students who applied to one of their own
 * company's postings, never the whole student table); STUDENT and
 * UNIVERSITY get their own grounding — see buildStudentContext and
 * buildUniversityContext — but the same "never a raw query, always a
 * closed CopilotIntent/context shape" discipline applies to all
 * three. Every call is audited, blocked or not, regardless of role.
 *
 * Conversation memory (CopilotConversation/CopilotMessage, see
 * schema.prisma) is what makes this a copilot instead of a search
 * box: each reply generator call gets the last COPILOT_HISTORY_TURNS
 * messages of real prior context, and every turn — including a
 * blocked one — is persisted so the thread is exactly what the user
 * sees again next time they open it.
 */

import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CopilotSender, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { UniversityService } from '../university/university.service';
import { containsProtectedCharacteristic } from './protected-characteristic.guard';
import { IntentParser, CopilotIntent } from './intent-parser/intent-parser.interface';
import { ReplyGenerator, ConversationTurn } from './reply-generator/reply-generator.interface';
import { COPILOT_HISTORY_TURNS, COPILOT_INTENT_PARSER, COPILOT_REPLY_GENERATOR } from './copilot.constants';

export interface CopilotQueryResult {
  conversationId: string;
  blocked: boolean;
  message: string;
  appliedFilters: CopilotIntent;
  data: Record<string, unknown>;
}

export interface CopilotConversationSummary {
  id: string;
  title: string | null;
  updatedAt: Date;
}

export interface CopilotConversationDetail extends CopilotConversationSummary {
  messages: Array<{ id: string; sender: CopilotSender; content: string; createdAt: Date }>;
}

@Injectable()
export class CopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly universityService: UniversityService,
    @Inject(COPILOT_INTENT_PARSER) private readonly intentParser: IntentParser,
    @Inject(COPILOT_REPLY_GENERATOR) private readonly replyGenerator: ReplyGenerator,
  ) {}

  // ---------------------------------------------------------------
  // Entry point
  // ---------------------------------------------------------------

  async query(
    userId: string,
    role: Role,
    question: string,
    conversationId?: string,
  ): Promise<CopilotQueryResult> {
    const conversation = await this.getOrCreateConversation(userId, conversationId, question);
    await this.appendMessage(conversation.id, 'USER', question);

    if (containsProtectedCharacteristic(question)) {
      await this.audit.log({
        actorId: userId,
        action: 'COPILOT_QUERY_BLOCKED',
        targetType: 'User',
        targetId: userId,
        metadata: { question, role },
      });
      const message =
        "I can't search or filter on protected characteristics like gender, ethnicity, religion, age, or " +
        "disability — that's a hard line, not a setting. Ask me about skills, major, year, verification, or " +
        "application status instead and I'm on it.";
      await this.appendMessage(conversation.id, 'SAGE', message);
      return { conversationId: conversation.id, blocked: true, appliedFilters: {}, data: {}, message };
    }

    const history = await this.loadHistory(conversation.id);

    let appliedFilters: CopilotIntent = {};
    let data: Record<string, unknown> = {};

    if (role === Role.RECRUITER) {
      const built = await this.buildRecruiterContext(userId, question);
      appliedFilters = built.appliedFilters;
      data = built.data;
    } else if (role === Role.STUDENT) {
      data = await this.buildStudentContext(userId);
    } else if (role === Role.UNIVERSITY) {
      data = await this.buildUniversityContext(userId);
    } else {
      throw new ForbiddenException('Sage Copilot is not available for this account type.');
    }

    const message = await this.replyGenerator.generate({ role, question, history, data });
    await this.appendMessage(conversation.id, 'SAGE', message, { appliedFilters, data });

    await this.audit.log({
      actorId: userId,
      action: 'COPILOT_QUERY',
      targetType: 'User',
      targetId: userId,
      metadata: { question, role, appliedFilters, conversationId: conversation.id },
    });

    return { conversationId: conversation.id, blocked: false, appliedFilters, data, message };
  }

  async listConversations(userId: string): Promise<CopilotConversationSummary[]> {
    const conversations = await this.prisma.copilotConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
      take: 50,
    });
    return conversations;
  }

  async getConversation(userId: string, conversationId: string): Promise<CopilotConversationDetail> {
    const conversation = await this.prisma.copilotConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found.');
    }
    return {
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  // ---------------------------------------------------------------
  // Conversation persistence
  // ---------------------------------------------------------------

  private async getOrCreateConversation(userId: string, conversationId: string | undefined, question: string) {
    if (conversationId) {
      const existing = await this.prisma.copilotConversation.findUnique({ where: { id: conversationId } });
      if (!existing || existing.userId !== userId) {
        throw new NotFoundException('Conversation not found.');
      }
      return existing;
    }
    return this.prisma.copilotConversation.create({
      data: { userId, title: question.slice(0, 80) },
    });
  }

  private async appendMessage(
    conversationId: string,
    sender: 'USER' | 'SAGE',
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.copilotMessage.create({
        data: {
          conversationId,
          sender: sender as unknown as CopilotSender,
          content,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      }),
      this.prisma.copilotConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  private async loadHistory(conversationId: string): Promise<ConversationTurn[]> {
    const messages = await this.prisma.copilotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: COPILOT_HISTORY_TURNS + 1, // +1 because the just-appended user question is in this batch too
      select: { sender: true, content: true },
    });
    // Drop the most recent (the question that triggered this call — the reply generator gets
    // it separately as `question`) and restore chronological order for the rest.
    return messages
      .slice(1)
      .reverse()
      .map((m) => ({ sender: (m.sender === 'SAGE' ? 'SAGE' : 'USER') as 'USER' | 'SAGE', content: m.content }));
  }

  // ---------------------------------------------------------------
  // RECRUITER — candidate search over the recruiter's own applicant pool
  // ---------------------------------------------------------------

  private async resolveCompanyId(userId: string): Promise<string> {
    const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!recruiterProfile) {
      throw new ForbiddenException('Only recruiters can use Sage Copilot in candidate-search mode.');
    }
    return recruiterProfile.companyId;
  }

  private async buildRecruiterContext(
    userId: string,
    question: string,
  ): Promise<{ appliedFilters: CopilotIntent; data: Record<string, unknown> }> {
    const companyId = await this.resolveCompanyId(userId);

    const skills = await this.prisma.skill.findMany({ select: { name: true } });
    const knownSkillNames = skills.map((s) => s.name);
    const intent = await this.intentParser.parse(question, knownSkillNames);

    // Step 1: the recruiter's own applicant pool, never the full student table.
    const applications = await this.prisma.application.findMany({
      where: { jobPosting: { companyId } },
      select: { userId: true },
      distinct: ['userId'],
    });
    let candidateUserIds = applications.map((a) => a.userId);
    const poolSize = candidateUserIds.length;

    if (poolSize === 0) {
      return { appliedFilters: intent, data: { candidates: [], poolSize: 0 } };
    }

    // Step 2: narrow by StudentProfile fields (major/year/university).
    const studentWhere: Record<string, unknown> = { userId: { in: candidateUserIds } };
    if (intent.major) {
      studentWhere.major = { contains: intent.major, mode: 'insensitive' };
    }
    if (intent.year) {
      studentWhere.year = intent.year;
    }
    if (intent.universityName) {
      studentWhere.university = { name: { contains: intent.universityName, mode: 'insensitive' } };
    }

    const students = await this.prisma.studentProfile.findMany({
      where: studentWhere,
      include: { university: { select: { name: true } } },
    });
    candidateUserIds = students.map((s) => s.userId);

    // Step 3: narrow by skills/authenticity, which live on ProfessionalProfile.
    if ((intent.skillNames && intent.skillNames.length > 0) || intent.minAuthenticity) {
      const someClause: Record<string, unknown> = {};
      if (intent.skillNames && intent.skillNames.length > 0) {
        someClause.skill = { name: { in: intent.skillNames } };
      }
      if (intent.minAuthenticity) {
        someClause.authenticityScore = { gte: intent.minAuthenticity };
      }
      const matches = await this.prisma.professionalProfile.findMany({
        where: { userId: { in: candidateUserIds }, skills: { some: someClause } },
        select: { userId: true },
      });
      const allowed = new Set(matches.map((m) => m.userId));
      candidateUserIds = candidateUserIds.filter((id: string) => allowed.has(id));
    }

    const candidates = students
      .filter((s) => candidateUserIds.includes(s.userId))
      .map((s) => ({ userId: s.userId, major: s.major, year: s.year, universityName: s.university?.name }));

    return { appliedFilters: intent, data: { candidates, poolSize } };
  }

  // ---------------------------------------------------------------
  // STUDENT — the student's own applications, matches, and CV state
  // ---------------------------------------------------------------

  private async buildStudentContext(userId: string): Promise<Record<string, unknown>> {
    const studentProfile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) {
      throw new ForbiddenException('Only students can use Sage Copilot in this mode.');
    }

    const [applications, matches, professionalProfile] = await Promise.all([
      this.prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { jobPosting: { include: { company: { select: { name: true } } } } },
      }),
      this.prisma.matchScore.findMany({
        where: { studentProfileId: studentProfile.id },
        orderBy: { score: 'desc' },
        take: 5,
        include: { jobPosting: { include: { company: { select: { name: true } } } } },
      }),
      this.prisma.professionalProfile.findUnique({
        where: { userId },
        include: { skills: { include: { skill: true } } },
      }),
    ]);

    const unverifiedSkills = (professionalProfile?.skills ?? [])
      .filter((s) => !s.verified)
      .map((s) => s.skill.name);

    return {
      applications: applications.map((a) => ({
        title: a.jobPosting.title,
        company: a.jobPosting.company.name,
        status: a.status,
        updatedAt: a.updatedAt.toISOString(),
      })),
      matches: matches.map((m) => ({
        title: m.jobPosting.title,
        company: m.jobPosting.company.name,
        score: m.score,
        matchedSkills: m.matchedSkills,
        missingSkills: m.missingSkills,
      })),
      unverifiedSkills,
      profileComplete: Boolean(professionalProfile?.headline) && (professionalProfile?.skills.length ?? 0) > 0,
    };
  }

  // ---------------------------------------------------------------
  // UNIVERSITY — the admin's own cohort, via UniversityService so the
  // numbers Sage cites are exactly the ones the dashboard itself shows.
  // ---------------------------------------------------------------

  private async buildUniversityContext(userId: string): Promise<Record<string, unknown>> {
    const [dashboard, analytics] = await Promise.all([
      this.universityService.getDashboard(userId),
      this.universityService.getAnalytics(userId),
    ]);
    return { ...dashboard, outcomes: analytics.outcomes, byFaculty: analytics.byFaculty, byIndustry: analytics.byIndustry };
  }
}
