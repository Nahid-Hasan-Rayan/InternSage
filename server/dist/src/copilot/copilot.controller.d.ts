import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CopilotService } from './copilot.service';
import { CopilotQueryDto } from './dto/copilot-query.dto';
export declare class CopilotController {
    private readonly copilotService;
    constructor(copilotService: CopilotService);
    query(user: AuthenticatedUser, dto: CopilotQueryDto): Promise<import("./copilot.service").CopilotQueryResult>;
}
