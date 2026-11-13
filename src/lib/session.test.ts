import { beforeAll, describe, expect, it } from 'vitest';

import { signSession, verifySession } from '@/lib/session-token';
import type { SessionUser } from '@/types';

const user: SessionUser = {
  id: 'user_test_1',
  email: 'demo@hexora.test',
  name: 'Demo Customer',
  role: 'CUSTOMER',
};

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-value-that-is-long-enough';
});

describe('session tokens', () => {
  it('round-trips a signed session', async () => {
    const token = await signSession(user);

    await expect(verifySession(token)).resolves.toEqual(user);
  });

  it('rejects a tampered token', async () => {
    const token = await signSession(user);

    await expect(verifySession(`${token}tampered`)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signSession(user, '-1s');

    await expect(verifySession(token)).resolves.toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const token = await signSession(user);
    const originalSecret = process.env.AUTH_SECRET;

    process.env.AUTH_SECRET = 'another-secret-value-that-is-long-enough';

    try {
      await expect(verifySession(token)).resolves.toBeNull();
    } finally {
      process.env.AUTH_SECRET = originalSecret;
    }
  });
});
