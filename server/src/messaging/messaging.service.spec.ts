/**
 * InternSage — MessagingService unit tests
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MSG-TEST-001
 * File   : src/messaging/messaging.service.spec.ts
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: class {},
  Role: { STUDENT: 'STUDENT', RECRUITER: 'RECRUITER', ADMIN: 'ADMIN' },
  Prisma: {},
}));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let prisma: any;
  let service: MessagingService;

  const application = {
    id: 'app-1',
    userId: 'student-user',
    jobPosting: { companyId: 'company-1', company: { trustScore: 100 } },
  };

  beforeEach(() => {
    prisma = {
      application: { findUnique: jest.fn() },
      recruiterProfile: { findUnique: jest.fn() },
      conversation: { findUnique: jest.fn(), create: jest.fn() },
      message: { count: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    };
    service = new MessagingService(prisma);
  });

  it('throws NotFound when the application does not exist', async () => {
    prisma.application.findUnique.mockResolvedValue(null);
    await expect(service.sendMessage('user-1', 'missing', 'hi')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a caller who is neither the applicant nor a recruiter at that company', async () => {
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.recruiterProfile.findUnique.mockResolvedValue(null);
    await expect(service.sendMessage('stranger', 'app-1', 'hi')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a recruiter from a different company than the job posting', async () => {
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-2' });
    await expect(service.sendMessage('other-recruiter', 'app-1', 'hi')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the applicant student to send the first message freely', async () => {
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.conversation.findUnique.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1' });
    prisma.message.create.mockResolvedValue({ id: 'msg-1' });

    const result = await service.sendMessage('student-user', 'app-1', 'Hello!');
    expect(result.id).toBe('msg-1');
    expect(prisma.message.count).not.toHaveBeenCalled(); // gating only checked for recruiters
  });

  it('blocks a low-trust recruiter from sending the first (cold) message', async () => {
    const lowTrustApp = { ...application, jobPosting: { companyId: 'company-1', company: { trustScore: 10 } } };
    prisma.application.findUnique.mockResolvedValue(lowTrustApp);
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    prisma.conversation.findUnique.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1' });
    prisma.message.count.mockResolvedValue(0);

    await expect(service.sendMessage('recruiter-user', 'app-1', 'Interested in your profile')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('allows a low-trust recruiter to reply once the student has already messaged first', async () => {
    const lowTrustApp = { ...application, jobPosting: { companyId: 'company-1', company: { trustScore: 10 } } };
    prisma.application.findUnique.mockResolvedValue(lowTrustApp);
    prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: 'company-1' });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1' });
    prisma.message.count.mockResolvedValue(1); // student already sent one
    prisma.message.create.mockResolvedValue({ id: 'msg-2' });

    const result = await service.sendMessage('recruiter-user', 'app-1', 'Thanks for reaching out!');
    expect(result.id).toBe('msg-2');
  });

  it('scopes listMessages to actual parties only', async () => {
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.recruiterProfile.findUnique.mockResolvedValue(null);
    await expect(service.listMessages('stranger', 'app-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
