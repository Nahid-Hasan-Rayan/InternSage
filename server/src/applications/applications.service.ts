/**
 * InternSage — ApplicationsService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-APPLICATIONS-SVC-001
 * File   : src/applications/applications.service.ts
 *
 * This is where the Blueprint's "no ghosting" guarantee becomes real
 * infrastructure rather than a UI promise (Master Blueprint §5,
 * "Applications" + §10 Phase 2): every status change emits
 * `application.statusChanged` via NestJS's EventEmitter2, decoupled
 * from whatever eventually consumes it (today: ApplicationStatusListener,
 * which just logs + records analytics; tomorrow: an email/notification
 * service that doesn't require touching this class at all).
 *
 * Two distinct trust boundaries, both enforced here (never trust a
 * client-supplied role claim — always re-derive from the DB):
 *   - A STUDENT may only ever move their OWN application to
 *     WITHDRAWN. They cannot move it to OFFER, REJECTED, etc. —
 *     that's not theirs to decide.
 *   - A RECRUITER may only move an application under a JobPosting
 *     belonging to THEIR OWN company (resolved from their
 *     RecruiterProfile, never a client-supplied companyId), and
 *     never to WITHDRAWN — withdrawing is the candidate's action,
 *     not something a recruiter does on their behalf.
 * REJECTED and WITHDRAWN are terminal — no further transition is
 * allowed out of either, by anyone.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplicationStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ClientApplicationStatus } from './dto/application.dto';

export interface ApplicationStatusChangedEvent {
  applicationId: string;
  applicantUserId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
}

const TERMINAL_STATUSES: ApplicationStatus[] = [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN];

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async apply(userId: string, jobPostingId: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!jobPosting) {
      throw new NotFoundException('That job posting no longer exists.');
    }

    try {
      const application = await this.prisma.application.create({
        data: { userId, jobPostingId },
      });
      this.events.emit('application.statusChanged', {
        applicationId: application.id,
        applicantUserId: userId,
        fromStatus: null,
        toStatus: application.status,
      });
      return application;
    } catch (error) {
      // The @@unique([userId, jobPostingId]) constraint is the
      // actual guarantee against double-applying — this just turns
      // Prisma's P2002 into a message a student will understand,
      // rather than a raw constraint-violation error.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException("You've already applied to this posting.");
      }
      throw error;
    }
  }

  async listMine(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: { jobPosting: { include: { company: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Resolves the recruiter's own company from their RecruiterProfile — never from a client-supplied companyId. */
  async listForRecruiter(userId: string) {
    const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!recruiterProfile) {
      throw new NotFoundException('No recruiter profile found for this account.');
    }
    return this.prisma.application.findMany({
      where: { jobPosting: { companyId: recruiterProfile.companyId } },
      include: { jobPosting: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    actingUserId: string,
    actingRole: Role,
    applicationId: string,
    requested: ClientApplicationStatus,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (TERMINAL_STATUSES.includes(application.status)) {
      throw new BadRequestException(
        `This application is already ${application.status.toLowerCase()} and cannot be changed further.`,
      );
    }

    if (actingRole === Role.STUDENT) {
      if (application.userId !== actingUserId) {
        throw new ForbiddenException('This is not your application.');
      }
      if (requested !== ClientApplicationStatus.WITHDRAWN) {
        throw new ForbiddenException('Students may only withdraw an application, not set its outcome.');
      }
    } else if (actingRole === Role.RECRUITER) {
      const recruiterProfile = await this.prisma.recruiterProfile.findUnique({
        where: { userId: actingUserId },
      });
      if (!recruiterProfile || recruiterProfile.companyId !== application.jobPosting.companyId) {
        throw new ForbiddenException('This application does not belong to your company.');
      }
      if (requested === ClientApplicationStatus.WITHDRAWN) {
        throw new ForbiddenException('Only the candidate can withdraw their own application.');
      }
    } else {
      throw new ForbiddenException('Not permitted to update application status.');
    }

    const fromStatus = application.status;
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: requested as unknown as ApplicationStatus },
    });

    this.events.emit('application.statusChanged', {
      applicationId: updated.id,
      applicantUserId: updated.userId,
      fromStatus,
      toStatus: updated.status,
    } satisfies ApplicationStatusChangedEvent);

    return updated;
  }
}
