import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Pagination } from '@/components/catalog/Pagination';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SearchBox } from '@/components/catalog/SearchBox';
import { Container } from '@/components/ui/Container';
import {
  getCatalog,
  getCategories,
  getPlatforms,
  normalizeSort,
} from '@/server/queries/catalog';
import type { CatalogSort, ProductFormat } from '@/types/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catalog',
  description:
    'Browse every digital and physical game edition in the Hexora store.',
};

type SearchParams = Record<string, string | string[] | undefined>;

interface CatalogPageProps {
  searchParams?: SearchParams;
}

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];

const formatOptions: Array<{ value: ProductFormat; label: string }> = [
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'PHYSICAL', label: 'Physical' },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeFormatUrl(value?: string): ProductFormat | undefined {
  const format = value?.trim().toUpperCase();
  return format === 'DIGITAL' || format === 'PHYSICAL' ? format : undefined;
}

function buildCatalogHref(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();

  for (const key of ['q', 'category', 'platform', 'format', 'sort']) {
    const value = merged[key];
    if (value) {
      params.set(key, value);
    }
  }

  if (merged.page && Number(merged.page) > 1) {
    params.set('page', merged.page);
  }

  const queryString = params.toString();
  return queryString ? `/catalog?${queryString}` : '/catalog';
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted sm:w-20 sm:shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-white/15 text-muted hover:border-white/30 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}

export default async function CatalogPage({
  searchParams = {},
}: CatalogPageProps) {
  const q = first(searchParams.q)?.trim() ?? '';
  const category = first(searchParams.category)?.trim();
  const platform = first(searchParams.platform)?.trim();
  const format = normalizeFormatUrl(first(searchParams.format));
  const sort = normalizeSort(first(searchParams.sort));
  const page = first(searchParams.page);

  const [catalog, categories, platforms] = await Promise.all([
    getCatalog({ page, q, category, platform, format, sort }),
    getCategories(),
    getPlatforms(),
  ]);

  const activeCategory = categories.find((item) => item.slug === category);
  const filterState: Record<string, string | undefined> = {
    q,
    category,
    platform,
    format,
    sort: sort === 'newest' ? undefined : sort,
  };

  return (
    <>
      <section className="border-b border-white/10 bg-surface/40">
        <Container className="py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Catalog
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
            Find your next game
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Browse digital keys and physical editions across every category,
            platform and format.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchBox
              defaultValue={q}
              hidden={{
                category,
                platform,
                format,
                sort: filterState.sort,
              }}
            />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-8 sm:py-10">
          <div className="grid gap-3 rounded-xl border border-white/10 bg-surface/60 p-4">
            <FilterRow label="Category">
              <FilterChip
                href={buildCatalogHref(filterState, {
                  category: undefined,
                  page: undefined,
                })}
                active={!category}
              >
                All categories
              </FilterChip>
              {categories.map((item) => (
                <FilterChip
                  key={item.slug}
                  href={buildCatalogHref(filterState, {
                    category: category === item.slug ? undefined : item.slug,
                    page: undefined,
                  })}
                  active={category === item.slug}
                >
                  {item.name}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Platform">
              <FilterChip
                href={buildCatalogHref(filterState, {
                  platform: undefined,
                  page: undefined,
                })}
                active={!platform}
              >
                All platforms
              </FilterChip>
              {platforms.map((item) => (
                <FilterChip
                  key={item}
                  href={buildCatalogHref(filterState, {
                    platform: platform === item ? undefined : item,
                    page: undefined,
                  })}
                  active={platform === item}
                >
                  {item}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Format">
              <FilterChip
                href={buildCatalogHref(filterState, {
                  format: undefined,
                  page: undefined,
                })}
                active={!format}
              >
                All formats
              </FilterChip>
              {formatOptions.map((item) => (
                <FilterChip
                  key={item.value}
                  href={buildCatalogHref(filterState, {
                    format: format === item.value ? undefined : item.value,
                    page: undefined,
                  })}
                  active={format === item.value}
                >
                  {item.label}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Sort">
              {sortOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  href={buildCatalogHref(filterState, {
                    sort: option.value === 'newest' ? undefined : option.value,
                    page: undefined,
                  })}
                  active={sort === option.value}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterRow>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted">
              {catalog.total} {catalog.total === 1 ? 'edition' : 'editions'} found
              {q ? ` for “${q}”` : ''}
              {activeCategory ? ` in ${activeCategory.name}` : ''}
            </p>
            {q || category || platform || format ? (
              <Link
                href="/catalog"
                className="text-sm font-semibold text-accent transition-colors hover:text-accent/80"
              >
                Clear all filters
              </Link>
            ) : null}
          </div>

          <div className="mt-5">
            {catalog.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-surface/50 px-6 py-12 text-center">
                <h2 className="text-lg font-semibold text-ink">
                  No games found
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {q ? (
                    <>
                      We could not find any games matching “{q}”. Try another
                      title or clear the filters.
                    </>
                  ) : (
                    'No games match the selected filters. Try a broader search.'
                  )}
                </p>
                <Link
                  href="/catalog"
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-accent/90"
                >
                  Browse the full catalog
                </Link>
              </div>
            ) : (
              <>
                <ProductGrid products={catalog.items} />
                <Pagination
                  page={catalog.page}
                  totalPages={catalog.totalPages}
                  query={filterState}
                />
              </>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
