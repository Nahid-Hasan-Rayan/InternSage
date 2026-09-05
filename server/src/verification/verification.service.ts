// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — VerificationService
 *
 * Timing is enforced server-side against `expiresAt`, never against
 * anything the client reports — the same principle the Build Plan
 * calls out for Interview Training applies just as much here.
 * Correct answers are never sent to the client; only prompt/choices
 * leave this service until after a session is submitted.
 */

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { StartVerificationDto } from './dto/start-verification.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';

const QUESTIONS_PER_SESSION = 5;
const SESSION_DURATION_MS = 10 * 60 * 1000;
const PASS_THRESHOLD = 70;
const DECAY_AMOUNT = 5;
const DECAY_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  private async loadOwnedUserSkill(userId: string, userSkillId: string) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { id: userSkillId },
      include: { professionalProfile: { select: { userId: true } }, skill: true },
    });
    if (!userSkill) {
      throw new NotFoundException('Claimed skill not found.');
    }
    if (userSkill.professionalProfile.userId !== userId) {
      throw new ForbiddenException('You can only verify your own claimed skills.');
    }
    return userSkill;
  }

  async startSession(userId: string, dto: StartVerificationDto) {
    const userSkill = await this.loadOwnedUserSkill(userId, dto.userSkillId);

    const activeSession = await this.prisma.verificationSession.findFirst({
      where: { userSkillId: userSkill.id, status: VerificationStatus.IN_PROGRESS, expiresAt: { gt: new Date() } },
    });
    if (activeSession) {
      throw new ConflictException('A verification session for this skill is already in progress.');
    }

    const bank = await this.prisma.verificationQuestion.findMany({ where: { skillId: userSkill.skillId } });
    if (bank.length === 0) {
      throw new NotFoundException('No verification questions exist yet for this skill.');
    }

    const chosen = shuffle(bank).slice(0, Math.min(QUESTIONS_PER_SESSION, bank.length));
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + SESSION_DURATION_MS);

    const session = await this.prisma.verificationSession.create({
      data: {
        userSkillId: userSkill.id,
        questionIds: chosen.map((q) => q.id),
        answers: [],
        status: VerificationStatus.IN_PROGRESS,
        startedAt,
        expiresAt,
      },
    });

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      questions: chosen.map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices })),
    };
  }

  async submitSession(userId: string, sessionId: string, dto: SubmitVerificationDto) {
    const session = await this.prisma.verificationSession.findUnique({
      where: { id: sessionId },
      include: { userSkill: { include: { professionalProfile: { select: { userId: true } } } } },
    });
    if (!session) {
      throw new NotFoundException('Verification session not found.');
    }
    if (session.userSkill.professionalProfile.userId !== userId) {
      throw new ForbiddenException('You can only submit your own verification session.');
    }
    if (session.status !== VerificationStatus.IN_PROGRESS) {
      throw new BadRequestException('This session has already been completed.');
    }
    if (new Date() > session.expiresAt) {
      await this.prisma.verificationSession.update({
        where: { id: session.id },
        data: { status: VerificationStatus.EXPIRED },
      });
      throw new BadRequestException('This verification session has expired.');
    }
    if (dto.answers.length !== session.questionIds.length) {
      throw new BadRequestException(
        `Expected ${session.questionIds.length} answers, received ${dto.answers.length}.`,
      );
    }

    const questions = await this.prisma.verificationQuestion.findMany({
      where: { id: { in: session.questionIds } },
    });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    let correctAnswers = 0;
    session.questionIds.forEach((questionId: string, index: number) => {
      const question = questionById.get(questionId);
      if (question && question.correctIndex === dto.answers[index]) {
        correctAnswers += 1;
      }
    });

    const score = Math.round((correctAnswers / session.questionIds.length) * 100);
    const verified = score >= PASS_THRESHOLD;
    const completedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.verificationSession.update({
        where: { id: session.id },
        data: { answers: dto.answers, score, status: VerificationStatus.COMPLETED, completedAt },
      }),
      this.prisma.userSkill.update({
        where: { id: session.userSkillId },
        data: { verified, authenticityScore: score, authenticityUpdatedAt: completedAt },
      }),
    ]);

    void this.analytics.record({
      type: 'VERIFICATION_COMPLETED',
      userId,
      metadata: { userSkillId: session.userSkillId, score, verified },
    });

    return { score, verified, correctAnswers, totalQuestions: session.questionIds.length };
  }

  /** Called only from the internal cron endpoint — never per-request. */
  async decayAllScores() {
    const cutoff = new Date(Date.now() - DECAY_INTERVAL_MS);
    const candidates = await this.prisma.userSkill.findMany({
      where: { authenticityScore: { not: null }, authenticityUpdatedAt: { lt: cutoff } },
    });

    for (const candidate of candidates) {
      const newScore = Math.max(0, (candidate.authenticityScore ?? 0) - DECAY_AMOUNT);
      await this.prisma.userSkill.update({
        where: { id: candidate.id },
        data: {
          authenticityScore: newScore,
          authenticityUpdatedAt: new Date(),
          verified: newScore >= PASS_THRESHOLD,
        },
      });
    }

    return { processed: candidates.length };
  }
}
