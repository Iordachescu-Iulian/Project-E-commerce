import 'dotenv/config';

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

import {
  categories as catalogCategories,
  MISSING_IMAGE_PRODUCT_SLUG,
  OUT_OF_STOCK_PRODUCT_SLUG,
} from '../prisma/product-catalog.mjs';

const prisma = new PrismaClient();
const publicDir = fileURLToPath(new URL('../public', import.meta.url));

function localImageFile(url: string): string | null {
  if (!url.startsWith('/images/')) {
    return null;
  }

  return path.join(publicDir, url.replace(/^\/+/, ''));
}

function localImageExists(url: string): boolean {
  const file = localImageFile(url);
  return file !== null && existsSync(file);
}

async function main(): Promise<void> {
  const [categories, products, deliveryMethods, discountCodes] =
    await Promise.all([
      prisma.category.findMany({ select: { slug: true } }),
      prisma.product.findMany({
        orderBy: { slug: 'asc' },
        select: {
          slug: true,
          gameSlug: true,
          price: true,
          stock: true,
          isActive: true,
          category: { select: { slug: true } },
          images: { orderBy: { position: 'asc' }, select: { url: true } },
        },
      }),
      prisma.deliveryMethod.findMany({ select: { code: true, price: true } }),
      prisma.discountCode.findMany({
        select: { code: true, type: true, value: true, maxUses: true },
      }),
    ]);

  const gameSlugs = new Set(products.map((product) => product.gameSlug));
  const imageCount = products.reduce(
    (total, product) => total + product.images.length,
    0,
  );

  console.log(
    `categories=${categories.length} games=${gameSlugs.size} products=${products.length} ` +
      `images=${imageCount} deliveryMethods=${deliveryMethods.length} discountCodes=${discountCodes.length}`,
  );

  const failures: string[] = [];
  const check = (condition: boolean, message: string): void => {
    if (!condition) {
      failures.push(message);
    }
  };

  check(
    categories.length === 4,
    `expected 4 categories, got ${categories.length}`,
  );
  check(
    gameSlugs.size === 16,
    `expected 16 distinct game slugs, got ${gameSlugs.size}`,
  );
  check(products.length === 32, `expected 32 products, got ${products.length}`);
  check(imageCount === 64, `expected 64 product images, got ${imageCount}`);
  check(
    deliveryMethods.length === 2,
    `expected 2 delivery methods, got ${deliveryMethods.length}`,
  );
  check(
    discountCodes.length === 1,
    `expected 1 discount code, got ${discountCodes.length}`,
  );

  const expectedCategorySlugs = catalogCategories
    .map((category) => category.slug)
    .sort()
    .join(',');
  const actualCategorySlugs = categories
    .map((category) => category.slug)
    .sort()
    .join(',');
  check(
    actualCategorySlugs === expectedCategorySlugs,
    `expected category slugs [${expectedCategorySlugs}], got [${actualCategorySlugs}]`,
  );

  for (const category of catalogCategories) {
    const categoryProducts = products.filter(
      (product) => product.category.slug === category.slug,
    );
    const categoryGames = new Set(
      categoryProducts.map((product) => product.gameSlug),
    );

    check(
      categoryGames.size === 4,
      `expected 4 games in ${category.slug}, got ${categoryGames.size}`,
    );
    check(
      categoryProducts.length === 8,
      `expected 8 products in ${category.slug}, got ${categoryProducts.length}`,
    );
  }

  const invalidPrices = products
    .filter((product) => Number(product.price) <= 0)
    .map((product) => product.slug);
  check(
    invalidPrices.length === 0,
    `expected every product to have a positive price; invalid: ${invalidPrices.join(', ') || 'none'}`,
  );

  const invalidStocks = products
    .filter((product) => product.stock < 0 || product.stock > 40)
    .map((product) => product.slug);
  check(
    invalidStocks.length === 0,
    `expected every stock value in 0..40; invalid: ${invalidStocks.join(', ') || 'none'}`,
  );

  const zeroStockProducts = products.filter((product) => product.stock === 0);
  check(
    zeroStockProducts.length === 1 &&
      zeroStockProducts[0]?.slug === OUT_OF_STOCK_PRODUCT_SLUG,
    `expected only ${OUT_OF_STOCK_PRODUCT_SLUG} to have stock 0, got [${zeroStockProducts
      .map((product) => product.slug)
      .join(', ')}]`,
  );

  const inactiveProducts = products
    .filter((product) => !product.isActive)
    .map((product) => product.slug);
  check(
    inactiveProducts.length === 0,
    `expected every seeded product to be active; inactive: ${inactiveProducts.join(', ') || 'none'}`,
  );

  const productsWithoutTwoImages = products
    .filter((product) => product.images.length !== 2)
    .map((product) => `${product.slug} (${product.images.length})`);
  check(
    productsWithoutTwoImages.length === 0,
    `expected every product to have 2 image rows; invalid: ${productsWithoutTwoImages.join(', ') || 'none'}`,
  );

  const missingImageProduct = products.find(
    (product) => product.slug === MISSING_IMAGE_PRODUCT_SLUG,
  );
  check(
    missingImageProduct !== undefined,
    `expected intentional missing-image product ${MISSING_IMAGE_PRODUCT_SLUG}`,
  );

  const missingImageUrls = products.flatMap((product) =>
    product.images
      .filter((image) => !localImageExists(image.url))
      .map((image) => `${product.slug}:${image.url}`),
  );

  const expectedMissingImage = missingImageProduct?.images[0]
    ? `${MISSING_IMAGE_PRODUCT_SLUG}:${missingImageProduct.images[0].url}`
    : '';
  check(
    missingImageUrls.length === 1 &&
      missingImageUrls[0] === expectedMissingImage,
    `expected exactly one missing local image (${expectedMissingImage || 'unknown'}), got [${missingImageUrls.join(', ') || 'none'}]`,
  );

  const deliveryByCode = new Map(
    deliveryMethods.map((method) => [method.code, Number(method.price)]),
  );
  check(
    deliveryByCode.get('DIGITAL') === 0 &&
      deliveryByCode.get('COURIER') === 19.99,
    `expected DIGITAL=0.00 and COURIER=19.99 delivery methods, got ${JSON.stringify(
      Object.fromEntries(deliveryByCode),
    )}`,
  );

  const discount = discountCodes.find((code) => code.code === 'HEXORA10');
  check(
    discount?.type === 'PERCENTAGE' &&
      Number(discount?.value) === 10 &&
      discount?.maxUses === 100,
    'expected the HEXORA10 discount code to be 10% with 100 uses',
  );

  if (failures.length > 0) {
    console.error(`Seed verification failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    'Seed verification passed: 4 categories, 16 games, 32 products, 64 images.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
