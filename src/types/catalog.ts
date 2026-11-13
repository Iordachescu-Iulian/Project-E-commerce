export type CatalogSort = 'newest' | 'price-asc' | 'price-desc' | 'name';

export type ProductFormat = 'DIGITAL' | 'PHYSICAL';

export const CATALOG_SORTS: readonly CatalogSort[] = [
  'newest',
  'price-asc',
  'price-desc',
  'name',
];

export const PRODUCT_FORMATS: readonly ProductFormat[] = ['DIGITAL', 'PHYSICAL'];

export interface CategoryRef {
  slug: string;
  name: string;
}

export interface CategorySummary extends CategoryRef {
  id: string;
  description: string;
  productCount: number;
}

export interface ProductImageData {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  gameTitle: string;
  gameSlug: string;
  edition: string;
  platform: string;
  format: ProductFormat;
  price: string;
  stock: number;
  imageUrl: string | null;
  imageAlt: string | null;
  category: CategoryRef;
}

export interface ProductDetail extends ProductCardData {
  description: string;
  images: ProductImageData[];
}

export interface CatalogQueryInput {
  page?: string | number;
  pageSize?: string | number;
  q?: string;
  category?: string;
  platform?: string;
  format?: string;
  sort?: string;
}
