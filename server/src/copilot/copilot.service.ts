/**
 * InternSage — CopilotService (Sage Copilot)
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-COPILOT-SVC-001
 * File   : src/copilot/copilot.service.ts
 *
 * Grounded, not freeform: a question never becomes a raw or
 * string-built query. It becomes a CopilotIntent (a fixed set of
 * optional fields), and CopilotIntent becomes exactly one Prisma
 * query built here. Scoped to the recruiter's own applicant pool
 * only — students who applied to one of their own company's
 * postings — never the whole student table; this is narrower than
 * the Blueprint's "entire applicant pool" phrasing, deliberately,
 * to keep a recruiter from ever searching students who never
 * applied to them. Every call is audited, blocked or not.
 */

import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { containsProtectedCharacteristic } from './protected-characteristic.guard';
import { IntentParser, CopilotIntent } from './intent-parser/intent-parser.interface';
import { COPILOT_INTENT_PARSER } from './copilot.constants';

export interface CopilotQueryResult {
  blocked: boolean;
  appliedFilters: CopilotIntent;
  results: Array<{ userId: string; major: string | null; year: number | null; universityName?: string }>;
}

@Injectable()
export class CopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(COPILOT_INTENT_PARSER) private readonly intentParser: IntentParser,
  ) {}

  private async resolveCompanyId(userId: string): Promise<string> {
    const recruiterProfile = await this.prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!recruiterProfile) {
      throw new ForbiddenException('Only recruiters can use Sage Copilot.');
    }
    return recruiterProfile.companyId;
  }

  async query(userId: string, question: string): Promise<CopilotQueryResult> {
    const companyId = await this.resolveCompanyId(userId);

    if (containsProtectedCharacteristic(question)) {
      await this.audit.log({
        actorId: userId,
        action: 'COPILOT_QUERY_BLOCKED',
        targetType: 'Company',
        targetId: companyId,
        metadata: { question },
      });
      return { blocked: true, appliedFilters: {}, results: [] };
    }

    const skills = await this.prisma.skill.findMany({ select: { name: true } });
    const knownSkillNames = skills.map((s) => s.name);
    const intent = await this.intentParser.parse(question, knownSkillNames);

    // Step 1: the recruiter's own applicant pool, never the full student table.
    const applications = await this.prisma.application.findMany({
      where: { jobPosting: { companyId } },
      select: { userId: true },
      distinct: ['userId'],
    });
    let candidateUserIds = applications.map((a) => a.userId);

    if (candidateUserIds.length === 0) {
      await this.logQuery(userId, companyId, question, intent, 0);
      return { blocked: false, appliedFilters: intent, results: [] };
    }

    // Step 2: narrow by StudentProfile fields (major/year/university).
    const studentWhere: Record<string, unknown> = { userId: { in: candidateUserIds } };
    if (intent.major) {
      studentWhere.major = { contains: intent.major, mode: 'insensitive' };
    }
    if (intent.year) {
      studentWhere.year = intent.year;
    }
    if (intent.universityName) {
      studentWhere.university = { name: { contains: intent.universityName, mode: 'insensitive' } };
    }

    const students = await this.prisma.studentProfile.findMany({
      where: studentWhere,
      include: { university: { select: { name: true } } },
    });
    candidateUserIds = students.map((s) => s.userId);

    // Step 3: narrow by skills/authenticity, which live on ProfessionalProfile.
    if ((intent.skillNames && intent.skillNames.length > 0) || intent.minAuthenticity) {
      const someClause: Record<string, unknown> = {};
      if (intent.skillNames && intent.skillNames.length > 0) {
        someClause.skill = { name: { in: intent.skillNames } };
      }
      if (intent.minAuthenticity) {
        someClause.authenticityScore = { gte: intent.minAuthenticity };
      }
      const matches = await this.prisma.professionalProfile.findMany({
        where: { userId: { in: candidateUserIds }, skills: { some: someClause } },
        select: { userId: true },
      });
      const allowed = new Set(matches.map((m) => m.userId));
      candidateUserIds = candidateUserIds.filter((id: string) => allowed.has(id));
    }

    const finalResults = students
      .filter((s) => candidateUserIds.includes(s.userId))
      .map((s) => ({ userId: s.userId, major: s.major, year: s.year, universityName: s.university?.name }));

    await this.logQuery(userId, companyId, question, intent, finalResults.length);

    return { blocked: false, appliedFilters: intent, results: finalResults };
  }

  private async logQuery(
    userId: string,
    companyId: string,
    question: string,
    appliedFilters: CopilotIntent,
    resultCount: number,
  ) {
    await this.audit.log({
      actorId: userId,
      action: 'COPILOT_QUERY',
      targetType: 'Company',
      targetId: companyId,
      metadata: { question, appliedFilters, resultCount },
    });
  }
}
