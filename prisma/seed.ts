import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { seedProducts } from './seed-products';
import { seedShop } from './seed-shop';
import { seedUsers } from './seed-users';

const prisma = new PrismaClient();

async function resetDatabase(): Promise<void> {
  await prisma.paymentEvent.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.deliveryMethod.deleteMany();
}

async function main(): Promise<void> {
  await resetDatabase();

  await seedShop(prisma);
  await seedUsers(prisma);
  await seedProducts(prisma);

  const [categories, gameRows, products, images, deliveryMethods, discountCodes, users] =
    await Promise.all([
      prisma.category.count(),
      prisma.product.findMany({ distinct: ['gameSlug'], select: { gameSlug: true } }),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.deliveryMethod.count(),
      prisma.discountCode.count(),
      prisma.user.count(),
    ]);

  console.log(
    `Seed complete: categories=${categories} games=${gameRows.length} products=${products} ` +
      `images=${images} deliveryMethods=${deliveryMethods} discountCodes=${discountCodes} users=${users}`,
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
