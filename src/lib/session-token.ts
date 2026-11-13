import { SignJWT, jwtVerify } from 'jose';

import type { Role, SessionUser } from '@/types';

const TOKEN_ALGORITHM = 'HS256';
const DEFAULT_EXPIRY = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET must be set to at least 16 characters');
  }

  return new TextEncoder().encode(secret);
}

function isRole(value: unknown): value is Role {
  return value === 'CUSTOMER' || value === 'ADMIN';
}

export async function signSession(
  user: SessionUser,
  expiresIn: string = DEFAULT_EXPIRY,
): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: TOKEN_ALGORITHM })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [TOKEN_ALGORITHM],
    });

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      !isRole(payload.role)
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
