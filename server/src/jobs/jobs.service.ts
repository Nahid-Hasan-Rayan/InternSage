// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — JobsService
 *
 * `dedupHash` is sha256(title + companyId + externalUrl) — this is
 * what lets the aggregator (and a recruiter re-posting the same
 * role) tell "already exists" from "genuinely new", without needing
 * a human to notice a duplicate. Every write that touches a posting
 * confirms the posting's companyId matches the caller's own company
 * first — same ownership-scoping discipline as ProfileService/CvService.
 */

import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { ListJobPostingsDto } from './dto/list-job-postings.dto';

export function computeDedupHash(title: string, companyId: string, externalUrl?: string | null): string {
  const normalized = `${title.trim().toLowerCase()}::${companyId}::${(externalUrl ?? '').trim().toLowerCase()}`;
  return createHash('sha256').update(normalized).digest('hex');
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  private async resolveRecruiterCompanyId(userId: string): Promise<string> {
    const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!recruiterProfile) {
      throw new ForbiddenException('Only recruiters can manage job postings.');
    }
    return recruiterProfile.companyId;
  }

  async create(userId: string, dto: CreateJobPostingDto) {
    const companyId = await this.resolveRecruiterCompanyId(userId);
    const dedupHash = computeDedupHash(dto.title, companyId, dto.externalUrl);

    const existing = await this.prisma.jobPosting.findUnique({ where: { dedupHash } });
    if (existing) {
      throw new ConflictException('An identical job posting already exists for your company.');
    }

    const posting = await this.prisma.jobPosting.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        requirementsText: dto.requirementsText,
        location: dto.location,
        category: dto.category,
        externalUrl: dto.externalUrl,
        dedupHash,
        requiredSkills: {
          create: dto.requiredSkillIds.map((skillId) => ({ skillId })),
        },
      },
      include: { requiredSkills: { include: { skill: true } } },
    });

    void this.analytics.record({
      type: 'JOB_POSTING_CREATED',
      userId,
      metadata: { jobPostingId: posting.id },
    });

    return posting;
  }

  async findMany(dto: ListJobPostingsDto) {
    const where: Record<string, unknown> = { isActive: true };
    if (dto.category) {
      where.category = dto.category;
    }
    if (dto.location) {
      where.location = { contains: dto.location, mode: 'insensitive' };
    }
    if (dto.keyword) {
      where.OR = [
        { title: { contains: dto.keyword, mode: 'insensitive' } },
        { description: { contains: dto.keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        take: dto.take,
        skip: dto.skip,
        orderBy: { postedAt: 'desc' },
        include: { company: { select: { id: true, name: true } }, requiredSkills: { include: { skill: true } } },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return { items, total, take: dto.take, skip: dto.skip };
  }

  async findOne(id: string) {
    const posting = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } }, requiredSkills: { include: { skill: true } } },
    });
    if (!posting) {
      throw new NotFoundException('Job posting not found.');
    }
    return posting;
  }

  private async assertOwnership(userId: string, jobPostingId: string) {
    const companyId = await this.resolveRecruiterCompanyId(userId);
    const posting = await this.prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!posting) {
      throw new NotFoundException('Job posting not found.');
    }
    if (posting.companyId !== companyId) {
      throw new ForbiddenException('You can only manage job postings that belong to your own company.');
    }
    return posting;
  }

  async update(userId: string, jobPostingId: string, dto: UpdateJobPostingDto) {
    await this.assertOwnership(userId, jobPostingId);
    const { requiredSkillIds, ...rest } = dto;

    return this.prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        ...rest,
        ...(requiredSkillIds
          ? {
              requiredSkills: {
                deleteMany: {},
                create: requiredSkillIds.map((skillId) => ({ skillId })),
              },
            }
          : {}),
      },
      include: { requiredSkills: { include: { skill: true } } },
    });
  }

  async deactivate(userId: string, jobPostingId: string) {
    await this.assertOwnership(userId, jobPostingId);
    // A soft deactivate, not a delete — Application history must
    // survive the posting closing.
    return this.prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { isActive: false },
    });
  }
}
