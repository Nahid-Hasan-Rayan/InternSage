import { PrismaService } from '../common/prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        service: string;
        timestamp: string;
    }>;
}
