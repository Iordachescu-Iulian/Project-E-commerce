import { describe, expect, it } from 'vitest';

import { stripe } from '@/lib/stripe';

const SECRET = 'whsec_test_secret';

function buildPayload(): string {
  return JSON.stringify({
    id: 'evt_test_1',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_1',
        object: 'payment_intent',
        metadata: { orderId: 'order_test_1' },
      },
    },
  });
}

describe('Stripe webhook signatures', () => {
  it('accepts a payload signed with the webhook secret', () => {
    const payload = buildPayload();
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });

    const event = stripe.webhooks.constructEvent(payload, header, SECRET);

    expect(event.id).toBe('evt_test_1');
    expect(event.type).toBe('payment_intent.succeeded');
  });

  it('rejects a modified payload', () => {
    const payload = buildPayload();
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    const tampered = payload.replace('order_test_1', 'order_test_2');

    expect(() => stripe.webhooks.constructEvent(tampered, header, SECRET)).toThrow();
  });

  it('rejects a signature produced with another secret', () => {
    const payload = buildPayload();
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_other_secret',
    });

    expect(() => stripe.webhooks.constructEvent(payload, header, SECRET)).toThrow();
  });

  it('rejects a malformed signature header', () => {
    expect(() =>
      stripe.webhooks.constructEvent(buildPayload(), 't=1,v1=bad', SECRET),
    ).toThrow();
  });
});
