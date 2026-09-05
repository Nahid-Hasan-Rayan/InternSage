// © 2026 Nahid Hasan Rayan. All rights reserved.

/**
 * InternSage — @Roles() decorator
 *
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
