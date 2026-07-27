import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class CronSecretGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
