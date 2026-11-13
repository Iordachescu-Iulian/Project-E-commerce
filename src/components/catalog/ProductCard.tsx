import Link from 'next/link';

import { formatPrice } from '@/lib/money';
import type { ProductCardData } from '@/types/catalog';

import { ProductImage } from './ProductImage';
import { StockBadge } from './StockBadge';

export function ProductCard({ product }: { product: ProductCardData }) {
  const productHref = `/products/${product.slug}`;
  const formatLabel = product.format === 'DIGITAL' ? 'Digital' : 'Physical';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-surface transition-colors hover:border-accent/40">
      <Link
        href={productHref}
        tabIndex={-1}
        aria-hidden="true"
        className="block aspect-[3/4] overflow-hidden bg-base"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          fallbackLabel={`${product.gameTitle} ${product.edition}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted">
          {product.platform} · {formatLabel}
        </p>
        <h3 className="text-sm font-semibold leading-snug text-ink">
          <Link
            href={productHref}
            aria-label={product.name}
            className="transition-colors hover:text-accent"
          >
            {product.gameTitle}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted">{product.edition}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-2">
          <span className="text-sm font-bold text-accent sm:text-base">
            {formatPrice(product.price)}
          </span>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </article>
  );
}
