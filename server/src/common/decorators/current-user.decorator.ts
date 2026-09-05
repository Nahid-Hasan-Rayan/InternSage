// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — @CurrentUser() decorator
 *
 * The single, deliberate choke point through which handlers read
 * "who is making this request". Every controller should use this
 * instead of reaching into `@Req()` directly — one place to audit
 * if the shape of the authenticated user ever changes.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  verified: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
