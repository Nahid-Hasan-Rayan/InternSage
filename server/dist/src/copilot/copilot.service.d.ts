import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { IntentParser, CopilotIntent } from './intent-parser/intent-parser.interface';
export interface CopilotQueryResult {
    blocked: boolean;
    appliedFilters: CopilotIntent;
    results: Array<{
        userId: string;
        major: string | null;
        year: number | null;
        universityName?: string;
    }>;
}
export declare class CopilotService {
    private readonly prisma;
    private readonly audit;
    private readonly intentParser;
    constructor(prisma: PrismaService, audit: AuditService, intentParser: IntentParser);
    private resolveCompanyId;
    query(userId: string, question: string): Promise<CopilotQueryResult>;
    private logQuery;
}
