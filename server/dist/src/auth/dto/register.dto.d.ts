import { Role } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    role: Role;
    fullName: string;
}
