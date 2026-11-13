import { describe, expect, it } from 'vitest';

import { getStockLabel, getStockState } from './StockBadge';

describe('getStockState', () => {
  it('treats zero, negative and non-finite stock as sold out', () => {
    expect(getStockState(0)).toBe('out-of-stock');
    expect(getStockState(-3)).toBe('out-of-stock');
    expect(getStockState(Number.NaN)).toBe('out-of-stock');
    expect(getStockState(Number.POSITIVE_INFINITY)).toBe('out-of-stock');
  });

  it('flags stock at or below the low-stock threshold', () => {
    expect(getStockState(1)).toBe('low-stock');
    expect(getStockState(10)).toBe('low-stock');
  });

  it('marks stock above the threshold as in stock', () => {
    expect(getStockState(11)).toBe('in-stock');
    expect(getStockState(40)).toBe('in-stock');
  });
});

describe('getStockLabel', () => {
  it('returns a clear label for every stock state', () => {
    expect(getStockLabel(0)).toBe('Sold out');
    expect(getStockLabel(4)).toBe('Only 4 left');
    expect(getStockLabel(32)).toBe('In stock');
  });
});
