// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — JWT Passport strategy
 *
 * Beyond verifying the token's signature and expiry (handled by
 * passport-jwt itself), `validate()` re-checks that the user still
 * exists in the database on every request. This is a deliberate
 * trade-off: it costs one indexed lookup per request, in exchange
 * for a deleted/deactivated account's old tokens stopping working
 * immediately instead of remaining valid until natural expiry.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  role: string;
}

const COOKIE_NAME = 'internsage_token';

/**
 * Reads the token from the httpOnly cookie the AuthController sets —
 * this is what actually closes off the XSS-exposure gap that comes
 * with a frontend storing a JWT in localStorage, since client-side
 * JS can't read an httpOnly cookie even if it's compromised. Falls
 * back to a Bearer header so a future non-browser client (mobile
 * app, a script) still has a working path without needing cookies.
 */
function cookieOrHeaderExtractor(req: Request): string | null {
  const fromCookie = req?.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    // No need to re-check JWT_SECRET here — ConfigModule's
    // `validate` (src/config/env.validation.ts) already refused to
    // boot the application at all if it were missing or too short,
    // so by the time this constructor runs it's guaranteed present.
    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true, role: true, verified: true },
    });
    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }
    // Attached to `request.user` for every downstream guard/handler.
    return user;
  }
}
