import type { Prisma } from '@prisma/client';

import { normalizePagination } from '@/lib/pagination';
import { prisma } from '@/lib/prisma';
import type { Paginated } from '@/types/api';
import {
  CATALOG_SORTS,
  PRODUCT_FORMATS,
  type CatalogQueryInput,
  type CatalogSort,
  type CategorySummary,
  type ProductCardData,
  type ProductDetail,
  type ProductFormat,
} from '@/types/catalog';

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  gameTitle: true,
  gameSlug: true,
  edition: true,
  platform: true,
  format: true,
  price: true,
  stock: true,
  category: { select: { slug: true, name: true } },
  images: {
    orderBy: { position: 'asc' },
    take: 1,
    select: { url: true, alt: true },
  },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export interface CatalogQueryPlan {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput[];
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return Number.NaN;
}

export function normalizeSort(value?: string): CatalogSort {
  return CATALOG_SORTS.includes(value as CatalogSort)
    ? (value as CatalogSort)
    : 'newest';
}

function normalizeFormat(value?: string): ProductFormat | null {
  const format = value?.trim().toUpperCase();
  return PRODUCT_FORMATS.includes(format as ProductFormat)
    ? (format as ProductFormat)
    : null;
}

export function buildCatalogOrderBy(
  sort: CatalogSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-asc':
      return [{ price: 'asc' }, { name: 'asc' }];
    case 'price-desc':
      return [{ price: 'desc' }, { name: 'asc' }];
    case 'name':
      return [{ name: 'asc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }, { id: 'asc' }];
  }
}

/**
 * Pure query planner shared by the Server Components and the API routes.
 * Pagination is normalized (page >= 1, page size <= 24) and empty filters are
 * dropped before the Prisma query is built.
 */
export function buildCatalogQuery(
  input: CatalogQueryInput = {},
): CatalogQueryPlan {
  const pagination = normalizePagination(
    toNumber(input.page),
    toNumber(input.pageSize),
  );
  const where: Prisma.ProductWhereInput = { isActive: true };

  const q = input.q?.trim();
  if (q) {
    where.name = { contains: q };
  }

  const category = input.category?.trim();
  if (category) {
    where.category = { slug: category };
  }

  const platform = input.platform?.trim();
  if (platform) {
    where.platform = platform;
  }

  const format = normalizeFormat(input.format);
  if (format) {
    where.format = format;
  }

  return {
    ...pagination,
    where,
    orderBy: buildCatalogOrderBy(normalizeSort(input.sort)),
  };
}

function mapProductCard(row: ProductCardRow): ProductCardData {
  const image = row.images[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    gameTitle: row.gameTitle,
    gameSlug: row.gameSlug,
    edition: row.edition,
    platform: row.platform,
    format: row.format,
    price: row.price.toString(),
    stock: row.stock,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? null,
    category: row.category,
  };
}

export async function getCatalog(
  query: CatalogQueryInput = {},
): Promise<Paginated<ProductCardData>> {
  const plan = buildCatalogQuery(query);
  const [total, rows] = await Promise.all([
    prisma.product.count({ where: plan.where }),
    prisma.product.findMany({
      where: plan.where,
      orderBy: plan.orderBy,
      skip: plan.skip,
      take: plan.take,
      select: productCardSelect,
    }),
  ]);

  return {
    items: rows.map(mapProductCard),
    page: plan.page,
    pageSize: plan.pageSize,
    total,
    totalPages: Math.ceil(total / plan.pageSize),
  };
}

export async function getCategories(): Promise<CategorySummary[]> {
  const rows = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });

  return rows.map(({ _count, ...category }) => ({
    ...category,
    productCount: _count.products,
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategorySummary | null> {
  const row = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
  });

  if (!row) {
    return null;
  }

  const { _count, ...category } = row;

  return { ...category, productCount: _count.products };
}

export async function getPlatforms(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ['platform'],
    orderBy: { platform: 'asc' },
    select: { platform: true },
  });

  return rows.map((row) => row.platform);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      ...productCardSelect,
      description: true,
      images: {
        orderBy: { position: 'asc' },
        select: { id: true, url: true, alt: true, position: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...mapProductCard(row),
    description: row.description,
    images: row.images,
  };
}

export async function getSiblingEditions(
  gameSlug: string,
  excludeId: string,
): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: {
      gameSlug,
      isActive: true,
      id: { not: excludeId },
    },
    orderBy: [{ price: 'asc' }],
    select: productCardSelect,
  });

  return rows.map(mapProductCard);
}
