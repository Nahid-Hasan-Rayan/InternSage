import { Role } from '@prisma/client';
export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    verified: boolean;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
