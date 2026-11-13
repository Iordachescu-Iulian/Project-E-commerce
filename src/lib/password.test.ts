import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing', () => {
  it('verifies the correct password', async () => {
    const hash = await hashPassword('Demo1234!');

    expect(hash).not.toBe('Demo1234!');
    await expect(verifyPassword('Demo1234!', hash)).resolves.toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('Demo1234!');

    await expect(verifyPassword('Wrong1234!', hash)).resolves.toBe(false);
  });

  it('uses a different salt for each hash', async () => {
    const [first, second] = await Promise.all([
      hashPassword('Demo1234!'),
      hashPassword('Demo1234!'),
    ]);

    expect(first).not.toBe(second);
  });
});
