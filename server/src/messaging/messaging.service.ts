// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — MessagingService
 *
 * REST + short client-side polling, not Socket.io — see the
 * Conversation/Message schema comment for why a persistent
 * WebSocket gateway doesn't fit a Vercel serverless deployment.
 * A conversation only ever exists tied to a specific Application;
 * there's no freestanding DM. Only the student who owns the
 * application and a recruiter from the company that owns the
 * job posting are ever a "party" to it — resolved from the
 * authenticated user, never trusted from anything client-supplied.
 */

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/** Below this, a recruiter can reply once a student has messaged first, but can't open the conversation. */
const COLD_MESSAGE_TRUST_THRESHOLD = 50;

type Party = { kind: 'STUDENT' } | { kind: 'RECRUITER'; companyId: string };

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadApplicationWithParties(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: { include: { company: true } } },
    });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return application;
  }

  private async resolveParty(userId: string, application: { userId: string; jobPosting: { companyId: string } }): Promise<Party> {
    if (application.userId === userId) {
      return { kind: 'STUDENT' };
    }
    const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
    if (recruiterProfile && recruiterProfile.companyId === application.jobPosting.companyId) {
      return { kind: 'RECRUITER', companyId: recruiterProfile.companyId };
    }
    throw new ForbiddenException('You are not a party to this application\'s conversation.');
  }

  private async getOrCreateConversation(applicationId: string) {
    const existing = await this.prisma.conversation.findUnique({ where: { applicationId } });
    if (existing) {
      return existing;
    }
    return this.prisma.conversation.create({ data: { applicationId } });
  }

  async sendMessage(userId: string, applicationId: string, body: string) {
    const application = await this.loadApplicationWithParties(applicationId);
    const party = await this.resolveParty(userId, application);

    const conversation = await this.getOrCreateConversation(applicationId);

    if (party.kind === 'RECRUITER') {
      const messageCount = await this.prisma.message.count({ where: { conversationId: conversation.id } });
      const isFirstMessage = messageCount === 0;
      if (isFirstMessage && application.jobPosting.company.trustScore < COLD_MESSAGE_TRUST_THRESHOLD) {
        throw new ForbiddenException(
          'Your company\'s trust score is currently too low to message a student first.',
        );
      }
    }

    return this.prisma.message.create({
      data: { conversationId: conversation.id, senderUserId: userId, body },
    });
  }

  async listMessages(userId: string, applicationId: string) {
    const application = await this.loadApplicationWithParties(applicationId);
    await this.resolveParty(userId, application);

    const conversation = await this.prisma.conversation.findUnique({ where: { applicationId } });
    if (!conversation) {
      return [];
    }
    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
  }
}
