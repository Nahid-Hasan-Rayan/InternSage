import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class MessagingController {
    private readonly messagingService;
    constructor(messagingService: MessagingService);
    list(user: AuthenticatedUser, applicationId: string): Promise<{
        id: string;
        createdAt: Date;
        conversationId: string;
        senderUserId: string;
        body: string;
    }[]>;
    send(user: AuthenticatedUser, applicationId: string, dto: SendMessageDto): Promise<{
        id: string;
        createdAt: Date;
        conversationId: string;
        senderUserId: string;
        body: string;
    }>;
}
