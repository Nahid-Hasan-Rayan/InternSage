/**
 * InternSage — MatchingService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-MATCH-SVC-001
 * File   : src/matching/matching.service.ts
 *
 * A score is never computed live on a page load — recompute() is
 * called explicitly (by the student, or by the internal cron
 * endpoint for everyone) and writes MatchScore rows; GET /matches
 * only ever reads what was last computed. matchedSkills/missingSkills
 * come from a real set intersection against JobRequiredSkill, not
 * from parsing free text, so the explanation is always accurate to
 * what the score actually used.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { cosineSimilarity, embedText } from '../common/embeddings/embedding.util';

interface StudentSkillSet {
  professionalProfileId: string;
  skillNames: Set<string>;
  authenticityAvg: number;
  cvText: string;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  private async loadStudentSkillSet(studentProfileId: string): Promise<StudentSkillSet> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true },
    });
    if (!student) {
      return { professionalProfileId: '', skillNames: new Set(), authenticityAvg: 0, cvText: '' };
    }

    const professionalProfile = await this.prisma.professionalProfile.findUnique({
      where: { userId: student.userId },
      include: {
        skills: { include: { skill: true } },
        experiences: true,
        projects: true,
      },
    });

    const skillNames = new Set((professionalProfile?.skills ?? []).map((s) => s.skill.name.toLowerCase()));
    const authenticityScores = (professionalProfile?.skills ?? [])
      .map((s) => s.authenticityScore)
      .filter((score): score is number => typeof score === 'number');
    const authenticityAvg =
      authenticityScores.length > 0
        ? authenticityScores.reduce((sum, s) => sum + s, 0) / authenticityScores.length
        : 0;

    const cvText = [
      ...(professionalProfile?.skills ?? []).map((s) => s.skill.name),
      ...(professionalProfile?.experiences ?? []).map((e) => `${e.title} ${e.description ?? ''}`),
      ...(professionalProfile?.projects ?? []).map((p) => `${p.title} ${p.description ?? ''}`),
      professionalProfile?.headline ?? '',
    ].join(' ');

    return { professionalProfileId: professionalProfile?.id ?? '', skillNames, authenticityAvg, cvText };
  }

  private async loadWeights(companyId: string) {
    const weights = await this.prisma.recruiterWeights.findUnique({ where: { companyId } });
    return {
      skillsWeight: weights?.skillsWeight ?? 0.4,
      projectsWeight: weights?.projectsWeight ?? 0.2,
      authenticityWeight: weights?.authenticityWeight ?? 0.3,
      softSkillsWeight: weights?.softSkillsWeight ?? 0.1,
    };
  }

  async recomputeForStudent(studentProfileId: string) {
    const skillSet = await this.loadStudentSkillSet(studentProfileId);
    const postings = await this.prisma.jobPosting.findMany({
      where: { isActive: true },
      include: { requiredSkills: { include: { skill: true } } },
    });

    const results = [];
    for (const posting of postings) {
      const requiredNames = posting.requiredSkills.map((r) => r.skill.name.toLowerCase());
      const matchedSkills = requiredNames.filter((name) => skillSet.skillNames.has(name));
      const missingSkills = requiredNames.filter((name) => !skillSet.skillNames.has(name));
      const skillOverlapRatio = requiredNames.length > 0 ? matchedSkills.length / requiredNames.length : 0;

      const textSimilarity = cosineSimilarity(
        embedText(skillSet.cvText),
        embedText(`${posting.title} ${posting.requirementsText}`),
      );
      const normalizedTextSimilarity = (textSimilarity + 1) / 2; // [-1,1] -> [0,1]

      const weights = await this.loadWeights(posting.companyId);
      const authenticityComponent = skillSet.authenticityAvg / 100;

      // Explainability requirement: the score is a documented weighted
      // sum, never a single opaque number nobody can reconstruct.
      const rawScore =
        weights.skillsWeight * skillOverlapRatio +
        weights.projectsWeight * normalizedTextSimilarity +
        weights.authenticityWeight * authenticityComponent +
        weights.softSkillsWeight * 0.5; // neutral placeholder until soft-skills self-assessment ships

      const score = Math.round(Math.max(0, Math.min(1, rawScore)) * 100);

      const matchScore = await this.prisma.matchScore.upsert({
        where: { studentProfileId_jobPostingId: { studentProfileId, jobPostingId: posting.id } },
        update: { score, matchedSkills, missingSkills, computedAt: new Date() },
        create: { studentProfileId, jobPostingId: posting.id, score, matchedSkills, missingSkills },
      });
      results.push(matchScore);
    }

    void this.analytics.record({
      type: 'MATCHES_RECOMPUTED',
      metadata: { studentProfileId, postingsScored: results.length },
    });

    return results;
  }

  async recomputeForAllStudents() {
    const students = await this.prisma.studentProfile.findMany({ select: { id: true } });
    let totalScored = 0;
    for (const student of students) {
      const results = await this.recomputeForStudent(student.id);
      totalScored += results.length;
    }
    return { studentsProcessed: students.length, matchScoresWritten: totalScored };
  }

  async getMatchesForStudent(studentProfileId: string, take = 20) {
    return this.prisma.matchScore.findMany({
      where: { studentProfileId },
      orderBy: { score: 'desc' },
      take,
      include: { jobPosting: { include: { company: { select: { id: true, name: true } } } } },
    });
  }
}
