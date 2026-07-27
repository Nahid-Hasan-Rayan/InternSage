/**
 * InternSage — AuthModule
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-AUTH-MOD-001
 * File   : src/auth/auth.module.ts
 */

import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    AnalyticsModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          // @nestjs/jwt (v11+) types `expiresIn` against the `ms`
          // package's template-literal StringValue type (e.g. "1d",
          // "2h"), which a plain `process.env` string can never
          // satisfy at compile time even though jsonwebtoken accepts
          // exactly these human-readable duration strings at runtime.
          // Narrow, explained cast — not a blanket type-safety opt-out.
          expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
