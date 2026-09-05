// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — CvService
 *
 * Same ownership rule as ProfileService: every write resolves the
 * caller's own ProfessionalProfile first via their userId, never
 * trusts a profile/professionalProfileId supplied by the client.
 */

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AddEducationDto, AddExperienceDto, AddProjectDto, AddSkillDto } from './dto/cv.dto';

@Injectable()
export class CvService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolves the caller's ProfessionalProfile id, or throws. */
  private async requireOwnProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Professional profile not found for this account.');
    }
    return profile.id;
  }

  async getFullCv(userId: string) {
    const profileId = await this.requireOwnProfileId(userId);
    const [profile, skills, experiences, educations, projects] = await Promise.all([
      this.prisma.professionalProfile.findUniqueOrThrow({ where: { id: profileId } }),
      this.prisma.userSkill.findMany({
        where: { professionalProfileId: profileId },
        include: { skill: true },
      }),
      this.prisma.experience.findMany({
        where: { professionalProfileId: profileId },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.education.findMany({ where: { professionalProfileId: profileId } }),
      this.prisma.project.findMany({ where: { professionalProfileId: profileId } }),
    ]);
    return { profile, skills, experiences, educations, projects };
  }

  /** The full reference catalog — used by job creation's required-skills picker and Copilot's known-skill list, not scoped to any one user. */
  async listSkillCatalog() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  async addSkill(userId: string, dto: AddSkillDto) {
    const profileId = await this.requireOwnProfileId(userId);
    const normalizedName = dto.name.trim();

    // Shared taxonomy: find the skill if it exists, create it if
    // not, but never let a client set its category — that stays
    // curated (defaults to OTHER, refined by an admin process
    // later) so search/matching can rely on it being meaningful.
    const skill = await this.prisma.skill.upsert({
      where: { name: normalizedName },
      update: {},
      create: { name: normalizedName },
    });

    return this.prisma.userSkill.upsert({
      where: {
        professionalProfileId_skillId: { professionalProfileId: profileId, skillId: skill.id },
      },
      update: {},
      create: { professionalProfileId: profileId, skillId: skill.id },
      include: { skill: true },
    });
  }

  async removeSkill(userId: string, skillId: string) {
    const profileId = await this.requireOwnProfileId(userId);
    const link = await this.prisma.userSkill.findUnique({
      where: { professionalProfileId_skillId: { professionalProfileId: profileId, skillId } },
    });
    if (!link) {
      throw new NotFoundException('That skill is not on your profile.');
    }
    await this.prisma.userSkill.delete({ where: { id: link.id } });
    return { removed: true };
  }

  async addExperience(userId: string, dto: AddExperienceDto) {
    const profileId = await this.requireOwnProfileId(userId);
    return this.prisma.experience.create({
      data: {
        professionalProfileId: profileId,
        title: dto.title,
        organization: dto.organization,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        description: dto.description,
      },
    });
  }

  async addEducation(userId: string, dto: AddEducationDto) {
    const profileId = await this.requireOwnProfileId(userId);
    return this.prisma.education.create({
      data: {
        professionalProfileId: profileId,
        institution: dto.institution,
        degree: dto.degree,
        startYear: dto.startYear,
        endYear: dto.endYear,
      },
    });
  }

  async addProject(userId: string, dto: AddProjectDto) {
    const profileId = await this.requireOwnProfileId(userId);
    return this.prisma.project.create({
      data: {
        professionalProfileId: profileId,
        title: dto.title,
        description: dto.description,
        portfolioUrl: dto.portfolioUrl,
      },
    });
  }

  /**
   * Defence in depth: even though every write above already scopes
   * by the caller's own profile id, this helper exists for any
   * future endpoint that takes a resource id directly (e.g. a
   * future PATCH /cv/experiences/:id) so ownership is always
   * re-checked before mutating, never assumed from a prior read.
   */
  async assertOwnsExperience(userId: string, experienceId: string): Promise<void> {
    const profileId = await this.requireOwnProfileId(userId);
    const experience = await this.prisma.experience.findUnique({ where: { id: experienceId } });
    if (!experience || experience.professionalProfileId !== profileId) {
      throw new ForbiddenException('You do not own this record.');
    }
  }
}
