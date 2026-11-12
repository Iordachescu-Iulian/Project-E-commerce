export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 24;

/**
 * Normalizes user-supplied pagination values.
 *
 * Page 0, negative values and non-numeric input fall back to page 1. The page
 * size falls back to 24 and is clamped to the catalog maximum of 24.
 */
export function normalizePagination(page: number, pageSize: number): Pagination {
  const normalizedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize >= 1
      ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    skip: (normalizedPage - 1) * normalizedPageSize,
    take: normalizedPageSize,
  };
}
