import { describe, expect, it } from 'vitest';

import { canManageAddress } from '@/server/services/addresses';

describe('address ownership', () => {
  it('allows a customer to manage their own address', () => {
    expect(canManageAddress('user_1', 'user_1')).toBe(true);
  });

  it('rejects another customer address', () => {
    expect(canManageAddress('user_1', 'user_2')).toBe(false);
  });
});
