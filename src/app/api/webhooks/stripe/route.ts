import type Stripe from 'stripe';
import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/security';
import { isStripeWebhookConfigured, stripe } from '@/lib/stripe';
import { recordPaymentEvent } from '@/server/services/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!isStripeWebhookConfigured || !webhookSecret) {
    return jsonError(503, 'Stripe webhook is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.');
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return jsonError(400, 'Missing Stripe signature.');
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return jsonError(400, 'Invalid Stripe signature.');
  }

  try {
    const result = await recordPaymentEvent(event);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Stripe webhook handling failed', error);
    return jsonError(500, 'Stripe webhook could not be processed.');
  }
}
