// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — ProfileService
 *
 * Security note: every method here takes the requesting user's id
 * from the authenticated JWT (never from a route param or request
 * body). That's deliberate — accepting a client-supplied profile
 * id here would be a textbook IDOR vulnerability, letting one
 * student read or edit another student's profile. A user can only
 * ever act on their own profile through this service.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateAcademicProfileDto } from './dto/update-academic-profile.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getAcademicProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { university: { select: { id: true, name: true, verified: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Academic profile not found for this account.');
    }
    return profile;
  }

  async updateAcademicProfile(userId: string, dto: UpdateAcademicProfileDto) {
    // Confirms ownership implicitly: `where: { userId }` can only
    // ever match the caller's own row.
    await this.getAcademicProfile(userId);
    return this.prisma.studentProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async getProfessionalProfile(userId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Professional profile not found for this account.');
    }
    return profile;
  }

  async updateProfessionalProfile(userId: string, dto: UpdateProfessionalProfileDto) {
    await this.getProfessionalProfile(userId);
    return this.prisma.professionalProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
