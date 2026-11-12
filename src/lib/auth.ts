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
 * Auth contract stub.
 *
 * The accounts branch replaces this module with the real signed-cookie
 * implementation. Until then every visitor is anonymous.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  return null;
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
