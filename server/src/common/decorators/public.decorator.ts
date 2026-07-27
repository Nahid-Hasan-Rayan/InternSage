/**
 * InternSage — @Public() decorator
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-DEC-001
 * File   : src/common/decorators/public.decorator.ts
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
