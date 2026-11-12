import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Pagination } from '@/components/catalog/Pagination';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Container } from '@/components/ui/Container';
import { getCatalog, getCategoryBySlug } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

interface CategoryPageProps {
  params: { slug: string };
  searchParams?: SearchParams;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);

  return {
    title: category ? category.name : 'Category not found',
    description: category?.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams = {},
}: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const catalog = await getCatalog({
    category: category.slug,
    page: first(searchParams.page),
  });

  return (
    <>
      <section className="border-b border-white/10 bg-surface/40">
        <Container className="py-10 sm:py-14">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-muted"
          >
            <Link href="/catalog" className="transition-colors hover:text-ink">
              Catalog
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{category.name}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-black leading-tight text-ink sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {category.description}
          </p>
          <p className="mt-4 text-sm text-muted">
            {category.productCount}{' '}
            {category.productCount === 1 ? 'edition' : 'editions'}
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-8 sm:py-12">
          <ProductGrid products={catalog.items} />
          <Pagination
            page={catalog.page}
            totalPages={catalog.totalPages}
            basePath={`/categories/${category.slug}`}
            label={`${category.name} pagination`}
          />
        </Container>
      </section>
    </>
  );
}
