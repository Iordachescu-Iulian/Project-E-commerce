import type { Prisma, PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

/**
 * The subset of Prisma used by the payment service. Tests supply a fake client,
 * production passes the shared singleton.
 */
export type PaymentDb = Pick<PrismaClient, '$transaction' | 'paymentEvent'>;

export interface StripeEventLike {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
}

export interface RecordPaymentResult {
  received: true;
  duplicate: boolean;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

/** Reads `metadata.orderId` from a PaymentIntent-like event object. */
export function extractOrderId(event: StripeEventLike): string | null {
  const object = readObject(event.data?.object);
  const metadata = readObject(object.metadata);

  return readString(metadata.orderId);
}

/** Reads the PaymentIntent id from a PaymentIntent-like event object. */
export function extractPaymentIntentId(event: StripeEventLike): string | null {
  return readString(readObject(event.data?.object).id);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

async function markOrderPaidInTransaction(
  tx: Prisma.TransactionClient,
  orderId: string,
  paymentIntentId: string | null,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} does not exist`);
  }

  if (order.paymentStatus === 'PAID') {
    return order;
  }

  const paidAt = order.paidAt ?? new Date();
  const updated = await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paymentStatus: 'PAID',
      paidAt,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus: 'PAID',
      note: 'Stripe payment succeeded',
    },
  });

  for (const item of order.items) {
    if (!item.productId) {
      continue;
    }

    const result = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });

    if (result.count === 0) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
  }

  return updated;
}

/**
 * Marks an order as paid and decrements stock for every order item in one
 * transaction. Calling it twice is a no-op the second time.
 */
export async function markOrderPaid(
  orderId: string,
  paymentIntentId: string | null,
  db: PaymentDb = prisma,
) {
  return db.$transaction((tx) =>
    markOrderPaidInTransaction(tx, orderId, paymentIntentId),
  );
}

/**
 * Records a Stripe event exactly once. Duplicate deliveries return
 * `{ duplicate: true }` without touching orders or stock.
 */
export async function recordPaymentEvent(
  event: StripeEventLike,
  db: PaymentDb = prisma,
): Promise<RecordPaymentResult> {
  const existing = await db.paymentEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    return { received: true, duplicate: true };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.paymentEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
        },
      });

      if (event.type === 'payment_intent.succeeded') {
        const orderId = extractOrderId(event);

        if (orderId) {
          await markOrderPaidInTransaction(
            tx,
            orderId,
            extractPaymentIntentId(event),
          );
        }
      }
    });
  } catch (error) {
    // Two concurrent deliveries of the same event: the unique index wins.
    if (isUniqueConstraintError(error)) {
      return { received: true, duplicate: true };
    }

    throw error;
  }

  return { received: true, duplicate: false };
}

/**
 * Cancels an order and returns its items to stock exactly once. Returns false
 * when the order is missing or already cancelled.
 */
export async function restoreStockForCancelledOrder(
  orderId: string,
  db: PaymentDb = prisma,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.status === 'CANCELLED') {
      return false;
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: 'CANCELLED',
        note: 'Stock restored after cancellation',
      },
    });

    for (const item of order.items) {
      if (!item.productId) {
        continue;
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return true;
  });
}
