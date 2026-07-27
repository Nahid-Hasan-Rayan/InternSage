import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { StartVerificationDto } from './dto/start-verification.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
export declare class VerificationService {
    private readonly prisma;
    private readonly analytics;
    constructor(prisma: PrismaService, analytics: AnalyticsService);
    private loadOwnedUserSkill;
    startSession(userId: string, dto: StartVerificationDto): Promise<{
        sessionId: string;
        expiresAt: Date;
        questions: {
            id: string;
            prompt: string;
            choices: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    submitSession(userId: string, sessionId: string, dto: SubmitVerificationDto): Promise<{
        score: number;
        verified: boolean;
        correctAnswers: number;
        totalQuestions: number;
    }>;
    decayAllScores(): Promise<{
        processed: number;
    }>;
}
