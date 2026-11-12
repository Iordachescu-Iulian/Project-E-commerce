import { describe, expect, it } from 'vitest';

import { formatPrice } from './money';

describe('formatPrice', () => {
  it('formats a number as euro currency', () => {
    expect(formatPrice(19.99)).toBe('€19.99');
  });

  it('formats zero with two decimals', () => {
    expect(formatPrice(0)).toBe('€0.00');
  });

  it('accepts numeric strings and Prisma Decimal-like values', () => {
    expect(formatPrice('5.5')).toBe('€5.50');
    expect(formatPrice({ toString: () => '12.30' })).toBe('€12.30');
  });
});
