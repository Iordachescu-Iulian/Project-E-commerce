import Link from 'next/link';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Container } from '@/components/ui/Container';
import { MAX_PAGE_SIZE } from '@/lib/pagination';
import { getCatalog, getCategories } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getCatalog({ pageSize: 8 }),
  ]);

  const editionCount = categories.reduce(
    (total, category) => total + category.productCount,
    0,
  );

  return (
    <>
      <section className="border-b border-white/10 bg-surface/40">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
              Digital and physical editions
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-tight text-ink sm:text-5xl">
              Your next game, digital or on the shelf.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Hexora brings digital keys and physical editions together in one
              store, with clear stock, fast delivery and a checkout built for
              gamers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-accent/90"
              >
                Browse the catalog
              </Link>
              <Link
                href="/catalog#catalog-search"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Search games
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-base p-6 shadow-2xl shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Store snapshot
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-sm text-muted">Categories</dt>
                <dd className="mt-1 text-3xl font-black text-accent">
                  {categories.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Editions</dt>
                <dd className="mt-1 text-3xl font-black text-accent">
                  {editionCount}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Per page</dt>
                <dd className="mt-1 text-3xl font-black text-accent">
                  {MAX_PAGE_SIZE}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Delivery options</dt>
                <dd className="mt-1 text-3xl font-black text-accent">2</dd>
              </div>
            </dl>
            <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-muted">
              Every game is grouped by edition, so the digital and physical
              versions stay one click apart.
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 sm:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Shop by category
            </h2>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-accent transition-colors hover:text-accent/80"
            >
              View the catalog
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group rounded-xl border border-white/10 bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {category.productCount} editions
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink transition-colors group-hover:text-accent">
                  {category.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/10 bg-surface/20">
        <Container className="py-12 sm:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              New in the store
            </h2>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-accent transition-colors hover:text-accent/80"
            >
              View all {featured.total} editions
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={featured.items} />
          </div>
        </Container>
      </section>
    </>
  );
}
