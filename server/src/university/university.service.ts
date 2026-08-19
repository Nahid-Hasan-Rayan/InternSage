/**
 * InternSage — UniversityService
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-UNI-SVC-001
 * File   : src/university/university.service.ts
 *
 * Every number in this file is either computed from real rows this
 * platform actually has, or explicitly documented as an estimate
 * with its source — nothing here is invented to fill a field the
 * frontend's contract happens to expect. Four honesty notes worth
 * reading before touching this file:
 *
 *  1. "Placement" == "received at least one OFFER-status
 *     application". The schema has no separate "accepted the
 *     offer"/"started the role" step, so an OFFER is the strongest
 *     honest signal available. Every stat named placementRatePct /
 *     studentsPlacedYtd / employedOrStudyingPct is really this
 *     proxy — the "or studying" half of that last name in
 *     particular is NOT tracked at all (no postgrad-progression
 *     data exists anywhere in this schema).
 *
 *  2. avgStartingSalaryRm is NOT a reported salary — nothing in this
 *     schema captures one (JobPosting has no salary field). It's an
 *     ESTIMATE: SalaryBenchmark's Randstad-sourced median for
 *     whichever seeded role's name appears in an offer's job title,
 *     averaged across matches. Returns 0, not a guess, when nothing
 *     matches or there are no offers yet.
 *
 *  3. byIndustry buckets by JobPosting.category (a SkillCategory
 *     enum value like SOFTWARE/MECHANICAL/BUSINESS) as a proxy —
 *     there is no real industry taxonomy anywhere in this schema.
 *     Labelled "industry" only because that's the frontend
 *     contract's existing field name.
 *
 *  4. UniversityEvent.registeredCount is always 0. There is no
 *     RSVP/registration model in this schema yet — 0 here means "not
 *     tracked", not "nobody registered". Flagged loudly rather than
 *     silently shipped, see this module's APPLY_INSTRUCTIONS.
 */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEventDto, CreatePartnerDto } from './dto/university.dto';

const RECENT_ACTIVITY_WINDOW_DAYS = 30;

interface StudentRow {
  userId: string;
  major: string | null;
  createdAt: Date;
}

interface ApplicationRow {
  userId: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
  jobPosting: { title: string; category: string | null; company: { name: string } };
}

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUniversityId(userId: string): Promise<string> {
    const adminProfile = await this.prisma.universityAdminProfile.findUnique({ where: { userId } });
    if (!adminProfile) {
      throw new ForbiddenException('Only university admins can access the university portal.');
    }
    return adminProfile.universityId;
  }

  private async loadCohort(universityId: string): Promise<{ students: StudentRow[]; applications: ApplicationRow[] }> {
    const students: StudentRow[] = await this.prisma.studentProfile.findMany({
      where: { universityId },
      select: { userId: true, major: true, createdAt: true },
    });
    if (students.length === 0) {
      return { students, applications: [] };
    }
    const applications: ApplicationRow[] = await this.prisma.application.findMany({
      where: { userId: { in: students.map((s) => s.userId) } },
      select: {
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        jobPosting: { select: { title: true, category: true, company: { select: { name: true } } } },
      },
    });
    return { students, applications };
  }

  private programmeBreakdown(
    students: StudentRow[],
    offerUserIds: Set<string>,
  ): Array<{ name: string; placementRatePct: number }> {
    const byMajor = new Map<string, { total: number; placed: number }>();
    for (const student of students) {
      if (!student.major) continue;
      const entry = byMajor.get(student.major) ?? { total: 0, placed: 0 };
      entry.total += 1;
      if (offerUserIds.has(student.userId)) entry.placed += 1;
      byMajor.set(student.major, entry);
    }
    return Array.from(byMajor.entries())
      .map(([name, { total, placed }]) => ({ name, placementRatePct: Math.round((placed / total) * 100) }))
      .sort((a, b) => b.placementRatePct - a.placementRatePct)
      .slice(0, 5);
  }

  private async estimateAvgStartingSalary(offerJobTitles: string[]): Promise<number> {
    if (offerJobTitles.length === 0) return 0;
    const benchmarks = await this.prisma.salaryBenchmark.findMany({ select: { role: true, median: true } });
    if (benchmarks.length === 0) return 0;

    const matchedMedians: number[] = [];
    for (const title of offerJobTitles) {
      const lowerTitle = title.toLowerCase();
      const match = benchmarks.find((b: { role: string; median: number }) => lowerTitle.includes(b.role.toLowerCase()));
      if (match) matchedMedians.push(match.median);
    }
    if (matchedMedians.length === 0) return 0;
    return Math.round(matchedMedians.reduce((sum, v) => sum + v, 0) / matchedMedians.length);
  }

  // ---------------------------------------------------------------
  // GET /university/dashboard
  // ---------------------------------------------------------------
  async getDashboard(userId: string) {
    const universityId = await this.resolveUniversityId(userId);
    const [university, { students, applications }, activePartners, upcomingEvents] = await Promise.all([
      this.prisma.university.findUnique({ where: { id: universityId }, select: { name: true } }),
      this.loadCohort(universityId),
      this.prisma.universityPartner.count({ where: { universityId } }),
      this.prisma.universityEvent.count({ where: { universityId, date: { gte: new Date() } } }),
    ]);

    const offerApps = applications.filter((a) => a.status === ApplicationStatus.OFFER);
    const offerUserIds = new Set(offerApps.map((a) => a.userId));

    const now = Date.now();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const windowStart = now - RECENT_ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const studentsPlacedYtd = new Set(
      offerApps.filter((a) => a.updatedAt.getTime() >= yearStart).map((a) => a.userId),
    ).size;

    const companyOfferCounts = new Map<string, number>();
    for (const app of offerApps) {
      const name = app.jobPosting.company.name;
      companyOfferCounts.set(name, (companyOfferCounts.get(name) ?? 0) + 1);
    }
    const topCompanies = Array.from(companyOfferCounts.entries())
      .map(([name, hires]) => ({ name, hires }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 5);

    const recentActivity: string[] = [];
    const recentApplicationCount = applications.filter((a) => a.createdAt.getTime() >= windowStart).length;
    const recentOfferCount = offerApps.filter((a) => a.updatedAt.getTime() >= windowStart).length;
    const recentNewStudents = students.filter((s) => s.createdAt.getTime() >= windowStart).length;
    if (recentApplicationCount > 0) {
      recentActivity.push(
        `${recentApplicationCount} student${recentApplicationCount === 1 ? '' : 's'} submitted application${recentApplicationCount === 1 ? '' : 's'} in the last ${RECENT_ACTIVITY_WINDOW_DAYS} days.`,
      );
    }
    if (recentOfferCount > 0) {
      recentActivity.push(
        `${recentOfferCount} student${recentOfferCount === 1 ? '' : 's'} received a job offer in the last ${RECENT_ACTIVITY_WINDOW_DAYS} days.`,
      );
    }
    if (recentNewStudents > 0) {
      recentActivity.push(`${recentNewStudents} new student${recentNewStudents === 1 ? '' : 's'} joined your cohort this month.`);
    }

    return {
      universityName: university?.name ?? '',
      stats: {
        placementRatePct: students.length === 0 ? 0 : Math.round((offerUserIds.size / students.length) * 100),
        studentsPlacedYtd,
        activePartners,
        upcomingEvents,
      },
      topCompanies,
      topProgrammes: this.programmeBreakdown(students, offerUserIds),
      recentActivity,
    };
  }

  // ---------------------------------------------------------------
  // GET /university/analytics
  // ---------------------------------------------------------------
  async getAnalytics(userId: string) {
    const universityId = await this.resolveUniversityId(userId);
    const { students, applications } = await this.loadCohort(universityId);
    const offerApps = applications.filter((a) => a.status === ApplicationStatus.OFFER);
    const offerUserIds = new Set(offerApps.map((a) => a.userId));

    const avgStartingSalaryRm = await this.estimateAvgStartingSalary(offerApps.map((a) => a.jobPosting.title));

    const categoryOfferCounts = new Map<string, number>();
    for (const app of offerApps) {
      const category = app.jobPosting.category ?? 'OTHER';
      categoryOfferCounts.set(category, (categoryOfferCounts.get(category) ?? 0) + 1);
    }
    const byIndustry = Array.from(categoryOfferCounts.entries())
      .map(([name, count]) => ({ name, pct: offerApps.length === 0 ? 0 : Math.round((count / offerApps.length) * 100) }))
      .sort((a, b) => b.pct - a.pct);

    return {
      outcomes: {
        employedOrStudyingPct: students.length === 0 ? 0 : Math.round((offerUserIds.size / students.length) * 100),
        avgStartingSalaryRm,
        avgOffersPerStudent: students.length === 0 ? 0 : Math.round((offerApps.length / students.length) * 100) / 100,
      },
      byFaculty: this.programmeBreakdown(students, offerUserIds).map((p) => ({
        name: p.name,
        employabilityPct: p.placementRatePct,
      })),
      byIndustry,
    };
  }

  // ---------------------------------------------------------------
  // Partners — a curated directory, deliberately independent of the
  // computed topCompanies above (see this file's header comment).
  // ---------------------------------------------------------------
  async getPartners(userId: string, params: { search?: string; industry?: string }) {
    const universityId = await this.resolveUniversityId(userId);
    const where: Record<string, unknown> = { universityId };
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }
    if (params.industry) {
      where.industry = params.industry;
    }
    const partners = await this.prisma.universityPartner.findMany({ where, orderBy: { name: 'asc' } });
    return { items: partners.map((p: { id: string; name: string; industry: string }) => ({ id: p.id, name: p.name, industry: p.industry })) };
  }

  async createPartner(userId: string, dto: CreatePartnerDto) {
    const universityId = await this.resolveUniversityId(userId);
    const partner = await this.prisma.universityPartner.create({
      data: { universityId, name: dto.name, industry: dto.industry },
    });
    return { id: partner.id, name: partner.name, industry: partner.industry };
  }

  // ---------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------
  async getEvents(userId: string) {
    const universityId = await this.resolveUniversityId(userId);
    const events = await this.prisma.universityEvent.findMany({ where: { universityId }, orderBy: { date: 'asc' } });
    const now = new Date();
    return {
      items: events.map((e: { id: string; title: string; date: Date }) => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        // No RSVP/registration model exists yet — see this file's
        // header comment (§4). Always 0, never fabricated.
        registeredCount: 0,
        status: e.date.getTime() <= now.getTime() ? ('ACTIVE' as const) : ('UPCOMING' as const),
      })),
    };
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    const universityId = await this.resolveUniversityId(userId);
    const event = await this.prisma.universityEvent.create({
      data: { universityId, title: dto.title, date: new Date(dto.date) },
    });
    const now = new Date();
    return {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      registeredCount: 0,
      status: event.date.getTime() <= now.getTime() ? ('ACTIVE' as const) : ('UPCOMING' as const),
    };
  }
}
