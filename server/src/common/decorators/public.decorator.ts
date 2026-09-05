// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — @Public() decorator
 *
 * The JwtAuthGuard is applied globally (see main app wiring) so
 * that a developer forgetting to protect a new route is a
 * compile-time-visible opt-OUT decision (@Public()), never a
 * silent opt-in mistake. Only register/login should ever carry
 * this decorator.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
