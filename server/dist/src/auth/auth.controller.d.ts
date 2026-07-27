import type { Response } from 'express';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    private setSessionCookie;
    register(dto: RegisterDto, res: Response): Promise<{
        user: import("./auth.service").SafeUser;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        user: import("./auth.service").SafeUser;
    }>;
    logout(res: Response): {
        loggedOut: boolean;
    };
    me(user: AuthenticatedUser): {
        user: AuthenticatedUser;
    };
}
