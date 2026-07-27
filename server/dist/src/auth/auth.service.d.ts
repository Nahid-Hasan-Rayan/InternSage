import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface SafeUser {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    verified: boolean;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly analytics;
    constructor(prisma: PrismaService, jwtService: JwtService, analytics: AnalyticsService);
    private extractDomain;
    private toSafeUser;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: SafeUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: SafeUser;
    }>;
    private issueSession;
}
