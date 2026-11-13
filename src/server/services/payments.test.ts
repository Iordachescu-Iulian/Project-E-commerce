import { describe, expect, it, vi } from 'vitest';

import {
  extractOrderId,
  extractPaymentIntentId,
  markOrderPaid,
  recordPaymentEvent,
  restoreStockForCancelledOrder,
  type PaymentDb,
  type StripeEventLike,
} from '@/server/services/payments';

function makeEvent(overrides: Partial<StripeEventLike> = {}): StripeEventLike {
  return {
    id: 'evt_1',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_1',
        metadata: { orderId: 'order_1' },
      },
    },
    ...overrides,
  };
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_1',
    status: 'NEW',
    paymentStatus: 'UNPAID',
    paidAt: null,
    stripePaymentIntentId: null,
    items: [
      { productId: 'product_1', quantity: 2 },
      { productId: null, quantity: 1 },
    ],
    ...overrides,
  };
}

function makeTx(order: unknown) {
  return {
    paymentEvent: { create: vi.fn().mockResolvedValue({}) },
    order: {
      findUnique: vi.fn().mockResolvedValue(order),
      update: vi.fn().mockImplementation(async ({ data }) => ({ ...(order as object), ...data })),
    },
    orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
    product: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

function makeDb(tx: unknown, existingEvent: unknown = null): PaymentDb {
  return {
    paymentEvent: {
      findUnique: vi.fn().mockResolvedValue(existingEvent),
    },
    $transaction: vi.fn(async (fn: (client: unknown) => Promise<unknown>) => fn(tx)),
  } as unknown as PaymentDb;
}

describe('extractOrderId / extractPaymentIntentId', () => {
  it('reads the order id and payment intent id from the event', () => {
    expect(extractOrderId(makeEvent())).toBe('order_1');
    expect(extractPaymentIntentId(makeEvent())).toBe('pi_1');
  });

  it('returns null when metadata is missing', () => {
    const event = makeEvent({ data: { object: { id: 'pi_2' } } });

    expect(extractOrderId(event)).toBeNull();
    expect(extractPaymentIntentId(event)).toBe('pi_2');
  });
});

describe('recordPaymentEvent', () => {
  it('returns duplicate and skips processing for a known event', async () => {
    const tx = makeTx(makeOrder());
    const db = makeDb(tx, { id: 'payment_event_1' });

    const result = await recordPaymentEvent(makeEvent(), db);

    expect(result).toEqual({ received: true, duplicate: true });
    expect(tx.paymentEvent.create).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it('records an unrelated event without touching orders', async () => {
    const tx = makeTx(makeOrder());
    const db = makeDb(tx);

    const result = await recordPaymentEvent(
      makeEvent({ type: 'payment_intent.payment_failed' }),
      db,
    );

    expect(result).toEqual({ received: true, duplicate: false });
    expect(tx.paymentEvent.create).toHaveBeenCalledTimes(1);
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it('marks the order paid for a successful payment', async () => {
    const tx = makeTx(makeOrder());
    const db = makeDb(tx);

    const result = await recordPaymentEvent(makeEvent(), db);

    expect(result).toEqual({ received: true, duplicate: false });
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order_1' },
        data: expect.objectContaining({
          status: 'PAID',
          paymentStatus: 'PAID',
          stripePaymentIntentId: 'pi_1',
        }),
      }),
    );
    expect(tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'product_1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
  });
});

describe('markOrderPaid', () => {
  it('does not decrement stock twice for an already paid order', async () => {
    const tx = makeTx(makeOrder({ status: 'PAID', paymentStatus: 'PAID' }));
    const db = makeDb(tx);

    await markOrderPaid('order_1', 'pi_1', db);

    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an unknown order', async () => {
    const tx = makeTx(null);
    const db = makeDb(tx);

    await expect(markOrderPaid('missing', 'pi_1', db)).rejects.toThrow(
      'Order missing does not exist',
    );
  });

  it('rolls back when stock cannot cover an item', async () => {
    const tx = makeTx(makeOrder());
    tx.product.updateMany.mockResolvedValueOnce({ count: 0 });
    const db = makeDb(tx);

    await expect(markOrderPaid('order_1', 'pi_1', db)).rejects.toThrow(
      'Insufficient stock for product product_1',
    );
  });
});

describe('restoreStockForCancelledOrder', () => {
  it('cancels the order and returns items to stock', async () => {
    const tx = makeTx(makeOrder());
    const db = makeDb(tx);

    await expect(restoreStockForCancelledOrder('order_1', db)).resolves.toBe(true);

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { status: 'CANCELLED' },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product_1' },
      data: { stock: { increment: 2 } },
    });
  });

  it('does nothing when the order is already cancelled', async () => {
    const tx = makeTx(makeOrder({ status: 'CANCELLED' }));
    const db = makeDb(tx);

    await expect(restoreStockForCancelledOrder('order_1', db)).resolves.toBe(false);

    expect(tx.product.update).not.toHaveBeenCalled();
  });
});
