import type { PrismaClient } from '@prisma/client';

import { hashPassword } from '../src/lib/password';

export const DEMO_CUSTOMER_EMAIL = 'demo@hexora.test';
export const DEMO_CUSTOMER_PASSWORD = 'Demo1234!';
export const DEMO_ADMIN_EMAIL = 'admin@hexora.test';
export const DEMO_ADMIN_PASSWORD = 'Admin1234!';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  const [customerHash, adminHash] = await Promise.all([
    hashPassword(DEMO_CUSTOMER_PASSWORD),
    hashPassword(DEMO_ADMIN_PASSWORD),
  ]);

  const customer = await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER_EMAIL },
    update: {
      name: 'Demo Customer',
      passwordHash: customerHash,
      role: 'CUSTOMER',
    },
    create: {
      email: DEMO_CUSTOMER_EMAIL,
      name: 'Demo Customer',
      passwordHash: customerHash,
      role: 'CUSTOMER',
    },
  });

  const addressCount = await prisma.address.count({ where: { userId: customer.id } });

  if (addressCount === 0) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        fullName: 'Demo Customer',
        phone: '+40 700 000 000',
        line1: 'Str. Exemplu 10',
        city: 'București',
        county: 'București',
        postalCode: '010101',
        country: 'Romania',
        isDefault: true,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: {
      name: 'Hexora Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    create: {
      email: DEMO_ADMIN_EMAIL,
      name: 'Hexora Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
}
