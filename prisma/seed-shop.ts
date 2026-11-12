import type { PrismaClient } from '@prisma/client';

const deliveryMethods = [
  {
    code: 'DIGITAL',
    name: 'Digital delivery',
    description: 'Instant delivery of a game key to your account.',
    price: '0.00',
  },
  {
    code: 'COURIER',
    name: 'Courier delivery',
    description: 'Physical edition shipped to your delivery address.',
    price: '19.99',
  },
] as const;

export async function seedShop(prisma: PrismaClient): Promise<void> {
  for (const method of deliveryMethods) {
    await prisma.deliveryMethod.upsert({
      where: { code: method.code },
      update: {
        name: method.name,
        description: method.description,
        price: method.price,
        isActive: true,
      },
      create: {
        code: method.code,
        name: method.name,
        description: method.description,
        price: method.price,
        isActive: true,
      },
    });
  }

  await prisma.discountCode.upsert({
    where: { code: 'HEXORA10' },
    update: {
      type: 'PERCENTAGE',
      value: '10.00',
      maxUses: 100,
      isActive: true,
    },
    create: {
      code: 'HEXORA10',
      type: 'PERCENTAGE',
      value: '10.00',
      maxUses: 100,
      usedCount: 0,
      isActive: true,
    },
  });
}
