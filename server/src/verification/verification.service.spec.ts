// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — VerificationService unit tests
 *
 * Not part of the originally pasted code — added because ownership
 * scoping, server-side expiry, and score/threshold computation are
 * exactly the "highest-stakes logic" this project's own testing
 * convention (see ARCHITECTURE.md/Master Blueprint Phase 9) says to
 * prioritize, and this service shipped without a spec file.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  VerificationStatus: { IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', EXPIRED: 'EXPIRED' },
  Prisma: {},
}));

import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';

describe('VerificationService', () => {
  let prisma: any;
  let analytics: any;
  let service: VerificationService;

  beforeEach(() => {
    prisma = {
      userSkill: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      verificationSession: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      verificationQuestion: { findMany: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    analytics = { record: jest.fn() };
    service = new VerificationService(prisma, analytics);
  });

  const ownedUserSkill = {
    id: 'us-1',
    skillId: 'skill-1',
    professionalProfile: { userId: 'user-1' },
  };

  describe('startSession', () => {
    it('throws NotFound when the claimed skill does not exist', async () => {
      prisma.userSkill.findUnique.mockResolvedValue(null);
      await expect(service.startSession('user-1', { userSkillId: 'missing' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Forbidden when the claimed skill belongs to a different user', async () => {
      prisma.userSkill.findUnique.mockResolvedValue({
        ...ownedUserSkill,
        professionalProfile: { userId: 'someone-else' },
      });
      await expect(service.startSession('user-1', { userSkillId: 'us-1' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws Conflict when a non-expired session is already in progress', async () => {
      prisma.userSkill.findUnique.mockResolvedValue(ownedUserSkill);
      prisma.verificationSession.findFirst.mockResolvedValue({ id: 'existing-session' });
      await expect(service.startSession('user-1', { userSkillId: 'us-1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws NotFound when no question bank exists for the skill', async () => {
      prisma.userSkill.findUnique.mockResolvedValue(ownedUserSkill);
      prisma.verificationSession.findFirst.mockResolvedValue(null);
      prisma.verificationQuestion.findMany.mockResolvedValue([]);
      await expect(service.startSession('user-1', { userSkillId: 'us-1' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('never exposes correctIndex in the returned questions', async () => {
      prisma.userSkill.findUnique.mockResolvedValue(ownedUserSkill);
      prisma.verificationSession.findFirst.mockResolvedValue(null);
      prisma.verificationQuestion.findMany.mockResolvedValue([
        { id: 'q1', prompt: 'What is 2+2?', choices: ['3', '4'], correctIndex: 1 },
      ]);
      prisma.verificationSession.create.mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = await service.startSession('user-1', { userSkillId: 'us-1' });

      expect(result.questions[0]).not.toHaveProperty('correctIndex');
      expect(result.questions[0]).toEqual({ id: 'q1', prompt: 'What is 2+2?', choices: ['3', '4'] });
    });
  });

  describe('submitSession', () => {
    const baseSession = {
      id: 'session-1',
      userSkillId: 'us-1',
      questionIds: ['q1', 'q2'],
      status: 'IN_PROGRESS',
      expiresAt: new Date(Date.now() + 60_000),
      userSkill: { professionalProfile: { userId: 'user-1' } },
    };

    it('throws Forbidden when the session belongs to a different user', async () => {
      prisma.verificationSession.findUnique.mockResolvedValue({
        ...baseSession,
        userSkill: { professionalProfile: { userId: 'someone-else' } },
      });
      await expect(service.submitSession('user-1', 'session-1', { answers: [0, 1] })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequest and marks the session expired when past expiresAt', async () => {
      prisma.verificationSession.findUnique.mockResolvedValue({
        ...baseSession,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.submitSession('user-1', 'session-1', { answers: [0, 1] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.verificationSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) }),
      );
    });

    it('throws BadRequest when the answer count does not match the question count', async () => {
      prisma.verificationSession.findUnique.mockResolvedValue(baseSession);
      await expect(service.submitSession('user-1', 'session-1', { answers: [0] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('computes score from correct answers and marks verified when at/above the pass threshold', async () => {
      prisma.verificationSession.findUnique.mockResolvedValue(baseSession);
      prisma.verificationQuestion.findMany.mockResolvedValue([
        { id: 'q1', correctIndex: 1 },
        { id: 'q2', correctIndex: 0 },
      ]);

      const result = await service.submitSession('user-1', 'session-1', { answers: [1, 0] });

      expect(result.score).toBe(100);
      expect(result.verified).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(analytics.record).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'VERIFICATION_COMPLETED' }),
      );
    });

    it('marks not verified when the score falls below the pass threshold', async () => {
      prisma.verificationSession.findUnique.mockResolvedValue(baseSession);
      prisma.verificationQuestion.findMany.mockResolvedValue([
        { id: 'q1', correctIndex: 1 },
        { id: 'q2', correctIndex: 0 },
      ]);

      const result = await service.submitSession('user-1', 'session-1', { answers: [0, 1] });

      expect(result.score).toBe(0);
      expect(result.verified).toBe(false);
    });
  });

  describe('decayAllScores', () => {
    it('reduces stale scores and flips verified false when the decayed score drops below threshold', async () => {
      prisma.userSkill.findMany.mockResolvedValue([{ id: 'us-1', authenticityScore: 72 }]);

      const result = await service.decayAllScores();

      expect(result.processed).toBe(1);
      expect(prisma.userSkill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'us-1' },
          data: expect.objectContaining({ authenticityScore: 67, verified: false }),
        }),
      );
    });

    it('never decays a score below 0', async () => {
      prisma.userSkill.findMany.mockResolvedValue([{ id: 'us-1', authenticityScore: 2 }]);

      await service.decayAllScores();

      expect(prisma.userSkill.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ authenticityScore: 0 }) }),
      );
    });
  });
});
