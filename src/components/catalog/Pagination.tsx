import Link from 'next/link';

export type QueryValues = Record<string, string | undefined>;

const pageLinkClass =
  'rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-white/30 hover:bg-white/5';
const disabledClass =
  'rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-muted/50';

export function buildPageHref(
  basePath: string,
  query: QueryValues,
  page: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key !== 'page' && value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function getPageWindow(
  page: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set<number>([1, totalPages]);
  for (
    let candidate = Math.max(2, page - 1);
    candidate <= Math.min(totalPages - 1, page + 1);
    candidate += 1
  ) {
    visible.add(candidate);
  }

  const sorted = Array.from(visible).sort((left, right) => left - right);
  const items: Array<number | 'ellipsis'> = [];

  sorted.forEach((candidate, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && candidate - previous > 1) {
      items.push('ellipsis');
    }
    items.push(candidate);
  });

  return items;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath?: string;
  query?: QueryValues;
  label?: string;
}

export function Pagination({
  page,
  totalPages,
  basePath = '/catalog',
  query = {},
  label = 'Pagination',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousHref = buildPageHref(basePath, query, page - 1);
  const nextHref = buildPageHref(basePath, query, page + 1);

  return (
    <nav
      aria-label={label}
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={previousHref} className={pageLinkClass} rel="prev">
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Previous
        </span>
      )}

      {getPageWindow(page, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className="rounded-md border border-accent bg-accent px-3 py-2 text-sm font-semibold text-base"
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={buildPageHref(basePath, query, item)}
            className={pageLinkClass}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={nextHref} className={pageLinkClass} rel="next">
          Next
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}
