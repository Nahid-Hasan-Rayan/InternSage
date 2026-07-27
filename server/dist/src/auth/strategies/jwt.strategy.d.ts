import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        verified: boolean;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        fullName: string;
    }>;
}
export {};
