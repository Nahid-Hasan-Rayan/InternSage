/**
 * InternSage — AuthController
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUTH-CTRL-001
 * File   : src/auth/auth.controller.ts
 *
 * register/login/logout are explicitly @Public() — everything else
 * in the app defaults to requiring a valid JWT (see JwtAuthGuard).
 *
 * The access token is set as an httpOnly cookie here, not returned
 * in the JSON body — a frontend that stores a token in localStorage
 * to read it back out is exposing it to any successful XSS; an
 * httpOnly cookie is invisible to JavaScript entirely, which is
 * what actually closes that gap rather than just documenting it.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const COOKIE_NAME = 'internsage_token';
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day — matches the default JWT_EXPIRES_IN

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setSessionCookie(res: Response, accessToken: string): void {
    // Netlify (frontend) and Vercel (backend) are different
    // registrable domains — this is a genuinely cross-site setup,
    // not same-site-different-port like local dev. SameSite=Lax
    // blocks cookies on cross-site fetch()/XHR entirely (it only
    // allows top-level navigation), which is exactly why login／
    // register could return 200/201 while every subsequent
    // credentialed request still came back 401 — the cookie was
    // being set, then silently refused on the way back out.
    // SameSite=None is what cross-site fetch() actually requires,
    // and browsers mandate Secure=true whenever SameSite=None is
    // used — hardcoding secure:true here would break local dev over
    // plain http://localhost, so both are tied to NODE_ENV instead.
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.authService.register(dto);
    this.setSessionCookie(res, accessToken);
    return { user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.authService.login(dto);
    this.setSessionCookie(res, accessToken);
    return { user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    // Must match setSessionCookie's attributes exactly — a
    // clearCookie call with a different sameSite/secure combination
    // than the cookie was originally set with can silently fail to
    // delete it in some browsers.
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return { loggedOut: true };
  }

  // Deliberately NOT @Public() — this is exactly what JwtAuthGuard
  // exists to protect. Returns whatever JwtStrategy.validate()
  // already resolved from the cookie; no extra DB call needed.
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }
}

