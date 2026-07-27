import { PrismaService } from '../prisma/prisma.service';
export interface AuditLogInput {
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(input: AuditLogInput): Promise<void>;
}
