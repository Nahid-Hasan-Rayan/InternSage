/**
 * InternSage — RecruiterToolsService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-RECTOOLS-SVC-002
 * File   : src/recruiter-tools/recruiter-tools.service.ts
 *
 * Two Blueprint features live here because they share the same
 * ownership boundary (a recruiter's own company, resolved from
 * RecruiterProfile, never a client-supplied companyId):
 *   - Configurable Recruiter Scoring Rubric (RecruiterWeights) —
 *     MatchingService already reads this; this is what lets a
 *     recruiter actually set it instead of only ever getting
 *     hardcoded defaults.
 *   - Structured Interview Kits & Scorecards — one kit per role,
 *     reused across every candidate for that role (never
 *     per-application), so evaluation is comparable — the same
 *     bias-reduction thesis Greenhouse is built on, per the
 *     Blueprint.
 */

import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateInterviewKitDto, SubmitScorecardDto, UpdateRecruiterWeightsDto } from './dto/recruiter-tools.dto';

const DEFAULT_WEIGHTS = {
  skillsWeight: 0.4,
  projectsWeight: 0.2,
  authenticityWeight: 0.3,
  softSkillsWeight: 0.1,
};

@Injectable()
export class RecruiterToolsService {
  constructor(private readonly prisma: PrismaService) { }

  private async resolveCompanyId(userId: string): Promise<string> {
    const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!recruiterProfile) {
      throw new ForbiddenException('Only recruiters can access recruiter tooling.');
    }
    return recruiterProfile.companyId;
  }

  async getMyWeights(userId: string) {
    const companyId = await this.resolveCompanyId(userId);
    const weights = await this.prisma.recruiterWeights.findUnique({ where: { companyId } });
    return weights ?? { companyId, ...DEFAULT_WEIGHTS };
  }

  async upsertMyWeights(userId: string, dto: UpdateRecruiterWeightsDto) {
    const companyId = await this.resolveCompanyId(userId);
    return this.prisma.recruiterWeights.upsert({
      where: { companyId },
      update: { ...dto },
      create: { companyId, ...dto },
    });
  }

  async createInterviewKit(userId: string, dto: CreateInterviewKitDto) {
    const companyId = await this.resolveCompanyId(userId);
    const existing = await this.prisma.interviewKit.findUnique({
      where: { companyId_roleTitle: { companyId, roleTitle: dto.roleTitle } },
    });
    if (existing) {
      throw new ConflictException('An interview kit for this role already exists for your company.');
    }
    // Cast criteria to any to satisfy Prisma's JSON type
    return this.prisma.interviewKit.create({
      data: { companyId, roleTitle: dto.roleTitle, criteria: dto.criteria as any },
    });
  }

  async listMyInterviewKits(userId: string) {
    const companyId = await this.resolveCompanyId(userId);
    return this.prisma.interviewKit.findMany({ where: { companyId }, orderBy: { roleTitle: 'asc' } });
  }

  private async assertApplicationOwnership(userId: string, applicationId: string) {
    const companyId = await this.resolveCompanyId(userId);
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    if (application.jobPosting.companyId !== companyId) {
      throw new ForbiddenException('This application does not belong to your company.');
    }
    return { application, companyId };
  }

  async submitScorecard(userId: string, applicationId: string, dto: SubmitScorecardDto) {
    const { companyId } = await this.assertApplicationOwnership(userId, applicationId);

    const kit = await this.prisma.interviewKit.findUnique({ where: { id: dto.interviewKitId } });
    if (!kit || kit.companyId !== companyId) {
      throw new ForbiddenException('This interview kit does not belong to your company.');
    }

    return this.prisma.scorecard.create({
      data: {
        applicationId,
        interviewKitId: dto.interviewKitId,
        submittedById: userId,
        ratings: dto.ratings,
        notes: dto.notes,
        recommendation: dto.recommendation,
      },
    });
  }

  async listScorecardsForApplication(userId: string, applicationId: string) {
    await this.assertApplicationOwnership(userId, applicationId);
    return this.prisma.scorecard.findMany({
      where: { applicationId },
      include: { interviewKit: { select: { roleTitle: true, criteria: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}