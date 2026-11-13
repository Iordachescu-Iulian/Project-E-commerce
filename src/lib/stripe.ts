import Stripe from 'stripe';

const PLACEHOLDER_KEY = 'sk_test_replace_me';

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

/**
 * True when a real Stripe test key is configured. The prototype ships with
 * placeholder values so that a missing key produces a clear 503 instead of a
 * crash at import time.
 */
export const isStripeConfigured = Boolean(secretKey && secretKey !== PLACEHOLDER_KEY);

export const isStripeWebhookConfigured = Boolean(
  isStripeConfigured && webhookSecret && webhookSecret !== 'whsec_replace_me',
);

/**
 * Shared Stripe client. The placeholder key is never sent anywhere: every
 * caller checks `isStripeConfigured` first.
 */
export const stripe = new Stripe(secretKey && secretKey !== PLACEHOLDER_KEY ? secretKey : 'sk_test_offline', {
  appInfo: {
    name: 'Hexora',
    version: '0.1.0',
  },
});
