import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';
import { StartVerificationDto } from './dto/start-verification.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
export declare class VerificationController {
    private readonly verificationService;
    constructor(verificationService: VerificationService);
    start(user: AuthenticatedUser, dto: StartVerificationDto): Promise<{
        sessionId: string;
        expiresAt: Date;
        questions: {
            id: string;
            prompt: string;
            choices: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    submit(user: AuthenticatedUser, sessionId: string, dto: SubmitVerificationDto): Promise<{
        score: number;
        verified: boolean;
        correctAnswers: number;
        totalQuestions: number;
    }>;
    decay(): Promise<{
        processed: number;
    }>;
}
