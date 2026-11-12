import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [categories, gameRows, products, images, deliveryMethods, discountCodes] =
    await Promise.all([
      prisma.category.count(),
      prisma.product.findMany({ distinct: ['gameSlug'], select: { gameSlug: true } }),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.deliveryMethod.count(),
      prisma.discountCode.count(),
    ]);

  console.log(
    `categories=${categories} games=${gameRows.length} products=${products} images=${images} ` +
      `deliveryMethods=${deliveryMethods} discountCodes=${discountCodes}`,
  );

  // The catalog branch extends this script with the full 4/16/32/64 checks.
  const failures: string[] = [];

  if (deliveryMethods !== 2) {
    failures.push(`expected deliveryMethods=2, got ${deliveryMethods}`);
  }

  if (discountCodes !== 1) {
    failures.push(`expected discountCodes=1, got ${discountCodes}`);
  }

  if (failures.length > 0) {
    console.error(`Seed verification failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log('Foundation shop seed verified.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
