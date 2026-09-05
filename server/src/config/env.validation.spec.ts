// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — Environment validation tests
 *
 * The first test below exists specifically because of a real bug:
 * `enableImplicitConversion` alone did not coerce a string "3000"
 * (exactly what `process.env.PORT` provides — every env var is a
 * string) into a number, so PORT failed @IsInt/@Min/@Max
 * simultaneously the first time this booted against a real .env
 * file. @Type(() => Number) fixed it. This test pins that fix down
 * so it can't silently regress if the validation schema is touched
 * again later.
 */

import { validateEnv } from './env.validation';

const validBaseConfig = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
  CORS_ORIGINS: 'http://localhost:3001',
};

describe('validateEnv', () => {
  it('accepts PORT as a string, exactly as process.env provides it', () => {
    // This is the regression case: process.env.PORT is ALWAYS a
    // string, never a number, no matter what's written in .env.
    const result = validateEnv({ ...validBaseConfig, PORT: '3000' });
    expect(result.PORT).toBe(3000);
    expect(typeof result.PORT).toBe('number');
  });

  it('falls back to the default PORT when it is not set at all', () => {
    const result = validateEnv({ ...validBaseConfig });
    expect(result.PORT).toBe(3000);
  });

  it('rejects a PORT that is not a valid integer', () => {
    expect(() => validateEnv({ ...validBaseConfig, PORT: 'not-a-port' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects a PORT outside the valid range', () => {
    expect(() => validateEnv({ ...validBaseConfig, PORT: '99999' })).toThrow();
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => validateEnv({ ...validBaseConfig, JWT_SECRET: 'too-short' })).toThrow(
      /JWT_SECRET must be at least 32 characters/,
    );
  });

  it('accepts a well-formed JWT_EXPIRES_IN', () => {
    const result = validateEnv({ ...validBaseConfig, JWT_EXPIRES_IN: '12h' });
    expect(result.JWT_EXPIRES_IN).toBe('12h');
  });

  it('rejects a malformed JWT_EXPIRES_IN', () => {
    expect(() => validateEnv({ ...validBaseConfig, JWT_EXPIRES_IN: '2.5 days' })).toThrow(
      /JWT_EXPIRES_IN must look like/,
    );
  });

  it('rejects a missing DATABASE_URL', () => {
    const { DATABASE_URL, ...withoutDb } = validBaseConfig;
    expect(() => validateEnv(withoutDb)).toThrow();
  });

  it('rejects an empty CORS_ORIGINS', () => {
    expect(() => validateEnv({ ...validBaseConfig, CORS_ORIGINS: '' })).toThrow(
      /CORS_ORIGINS must list at least one allowed origin/,
    );
  });
});
