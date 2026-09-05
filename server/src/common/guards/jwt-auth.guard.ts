// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Global JWT auth guard
 *
 * Registered as the app-wide default guard (see AppModule), so
 * every route requires a valid JWT unless explicitly marked
 * @Public(). This makes "forgot to protect an endpoint" a class
 * of bug that cannot happen by omission.
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
