import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductGallery } from '@/components/catalog/ProductGallery';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { StockBadge } from '@/components/catalog/StockBadge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { formatPrice } from '@/lib/money';
import {
  getProductBySlug,
  getSiblingEditions,
} from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  return {
    title: product ? product.name : 'Product not found',
    description: product?.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const siblings = await getSiblingEditions(product.gameSlug, product.id);
  const formatLabel = product.format === 'DIGITAL' ? 'Digital' : 'Physical';

  return (
    <>
      <section className="border-b border-white/10 bg-surface/40">
        <Container className="py-8 sm:py-12">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-muted"
          >
            <Link href="/catalog" className="transition-colors hover:text-ink">
              Catalog
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/categories/${product.category.slug}`}
              className="transition-colors hover:text-ink"
            >
              {product.category.name}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{product.gameTitle}</span>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
            <ProductGallery
              images={product.images}
              fallbackLabel={`${product.gameTitle} ${product.edition}`}
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                {product.category.name}
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
                {product.gameTitle}
              </h1>
              <p className="mt-2 text-base text-muted">
                {product.edition} · {product.platform} · {formatLabel}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-black text-ink">
                  {formatPrice(product.price)}
                </span>
                <StockBadge stock={product.stock} />
              </div>

              <p className="mt-6 text-sm leading-relaxed text-muted sm:text-base">
                {product.description}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-surface p-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Availability
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : 'Sold out'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Format
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">{formatLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Platform
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {product.platform}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Edition
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {product.edition}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <Button
                  disabled
                  className="w-full px-5 py-3 disabled:border disabled:border-white/10 disabled:bg-white/5 disabled:text-muted disabled:opacity-100 sm:w-auto"
                  aria-describedby="cart-availability-note"
                >
                  Add to cart — available in week 8
                </Button>
                <p
                  id="cart-availability-note"
                  className="mt-2 text-xs text-muted"
                >
                  Cart and checkout arrive in week 8 of the project.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {siblings.length > 0 ? (
        <section>
          <Container className="py-10 sm:py-14">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-ink sm:text-2xl">
                Other editions of {product.gameTitle}
              </h2>
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-sm font-semibold text-accent transition-colors hover:text-accent/80"
              >
                More in {product.category.name}
              </Link>
            </div>
            <div className="mt-6">
              <ProductGrid products={siblings} />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
