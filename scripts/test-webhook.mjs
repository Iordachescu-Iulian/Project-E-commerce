import 'dotenv/config';

import Stripe from 'stripe';

const baseUrl = process.env.APP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret || webhookSecret === 'whsec_replace_me') {
  console.error('Set STRIPE_WEBHOOK_SECRET in .env before running this script.');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_offline');
const suffix = Date.now();
const payload = JSON.stringify({
  id: `evt_test_${suffix}`,
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: `pi_test_${suffix}`,
      object: 'payment_intent',
      metadata: {},
    },
  },
});

const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });

async function send(label) {
  const response = await fetch(`${baseUrl}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  });
  const body = await response.text();

  console.log(`${label}: HTTP ${response.status} ${body}`);

  return { status: response.status, body };
}

const first = await send('first delivery');
const second = await send('second delivery');

const firstBody = first.body.includes('"duplicate":false');
const secondBody = second.body.includes('"duplicate":true');

if (first.status !== 200 || !firstBody || second.status !== 200 || !secondBody) {
  console.error('Webhook idempotency check failed: expected duplicate false, then true.');
  process.exit(1);
}

console.log('Webhook idempotency check passed.');
