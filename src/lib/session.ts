import { cookies } from 'next/headers';

import { signSession, verifySession } from '@/lib/session-token';
import type { SessionUser } from '@/types';

export const SESSION_COOKIE = 'hexora_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSession(user);

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | undefined> {
  return cookies().get(SESSION_COOKIE)?.value;
}

export async function readSessionUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();

  if (!token) {
    return null;
  }

  return verifySession(token);
}
