/**
 * InternSage — Roles guard
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-GUARD-002
 * File   : src/common/guards/roles.guard.ts
 *
 * Runs after JwtAuthGuard (request.user is already populated by
 * then) and checks the authenticated user's role against any
 * @Roles(...) metadata on the handler. Routes with no @Roles()
 * metadata are allowed through — this guard only ever narrows
 * access, never widens it.
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    return true;
  }
}
