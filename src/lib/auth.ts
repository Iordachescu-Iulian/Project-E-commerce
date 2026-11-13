import { prisma } from '@/lib/prisma';
import { readSessionUser } from '@/lib/session';
import type { Role, SessionUser } from '@/types';

export class AuthError extends Error {
  readonly status: number;

  constructor(status: number, message = 'Authentication error') {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Returns the signed-in user, or null. The database lookup keeps role changes
 * effective before the cookie expires.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await readSessionUser();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError(401, 'Authentication required');
  }

  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user || user.role !== role) {
    throw new AuthError(403, 'Forbidden');
  }

  return user;
}
