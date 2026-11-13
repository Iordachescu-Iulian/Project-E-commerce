import { prisma } from '@/lib/prisma';

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export function canManageAddress(userId: string, addressUserId: string): boolean {
  return userId === addressUserId;
}

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(userId: string, input: AddressInput) {
  return prisma.$transaction(async (tx) => {
    const existingCount = await tx.address.count({ where: { userId } });
    const isDefault = input.isDefault ?? existingCount === 0;

    if (isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        county: input.county || null,
        postalCode: input.postalCode,
        country: input.country || 'Romania',
        isDefault,
      },
    });
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      return null;
    }

    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 === undefined ? undefined : input.line2 || null,
        city: input.city,
        county: input.county === undefined ? undefined : input.county || null,
        postalCode: input.postalCode,
        country: input.country,
        isDefault: input.isDefault,
      },
    });
  });
}

export async function deleteAddress(userId: string, addressId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      return false;
    }

    await tx.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const nextAddress = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await tx.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return true;
  });
}
