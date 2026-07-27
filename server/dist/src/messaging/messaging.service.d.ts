import { PrismaService } from '../common/prisma/prisma.service';
export declare class MessagingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private loadApplicationWithParties;
    private resolveParty;
    private getOrCreateConversation;
    sendMessage(userId: string, applicationId: string, body: string): Promise<{
        id: string;
        createdAt: Date;
        conversationId: string;
        senderUserId: string;
        body: string;
    }>;
    listMessages(userId: string, applicationId: string): Promise<{
        id: string;
        createdAt: Date;
        conversationId: string;
        senderUserId: string;
        body: string;
    }[]>;
}
