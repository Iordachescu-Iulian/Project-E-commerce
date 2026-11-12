import { describe, expect, it } from 'vitest';

import { normalizePagination } from './pagination';

describe('normalizePagination', () => {
  it('falls back to page 1 and clamps the page size to 24', () => {
    expect(normalizePagination(0, 100)).toEqual({
      page: 1,
      pageSize: 24,
      skip: 0,
      take: 24,
    });
  });

  it('keeps a valid page and page size', () => {
    expect(normalizePagination(3, 12)).toEqual({
      page: 3,
      pageSize: 12,
      skip: 24,
      take: 12,
    });
  });

  it('normalizes negative and non-numeric input', () => {
    expect(normalizePagination(-4, Number.NaN)).toEqual({
      page: 1,
      pageSize: 24,
      skip: 0,
      take: 24,
    });
  });

  it('floors fractional values and never returns a page below 1', () => {
    expect(normalizePagination(2.9, 10.8)).toEqual({
      page: 2,
      pageSize: 10,
      skip: 10,
      take: 10,
    });
  });
});
