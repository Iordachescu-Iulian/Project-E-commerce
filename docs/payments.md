# Payments and the Stripe webhook (P2 scope)

Hexora uses Stripe in **test mode**. P2 does not create real charges: checkout
and the PaymentIntent creation arrive in weeks 8–9. What P2 does implement is the
half of the flow that must be correct before money is involved:

- signature verification of every incoming webhook,
- idempotent storage of every Stripe event,
- the order/stock service that a successful payment will call.

## Environment variables

Copy `.env.example` to `.env` and fill in test-mode values:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_…`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable test key (`pk_test_…`). |
| `STRIPE_WEBHOOK_SECRET` | Signing secret shown by `stripe listen` (`whsec_…`). |
| `NEXT_PUBLIC_APP_URL` | Public app URL, `http://localhost:3000` locally. |

When the keys are still placeholders the webhook answers **503** instead of
crashing, and no Stripe call is attempted.

## Test cards

| Card number | Behaviour |
| --- | --- |
| `4242 4242 4242 4242` | Payment succeeds. |
| `4000 0000 0000 0002` | Card is declined. |
| `4000 0025 0000 3155` | Requires 3D Secure authentication. |
| `4000 0000 0000 9995` | Declined for insufficient funds. |

Use any future expiry date and any three-digit CVC.

## Local webhook testing

1. Start the app: `npm run dev`.
2. Forward Stripe events to the route:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the printed `whsec_…` value into `STRIPE_WEBHOOK_SECRET` and restart the
   dev server.
3. Trigger an event from another terminal:

   ```bash
   stripe trigger payment_intent.succeeded
   ```

4. Or send a signed event twice with the bundled script:

   ```bash
   node scripts/test-webhook.mjs
   ```

   The first delivery prints `{"received":true,"duplicate":false}` and the second
   prints `{"received":true,"duplicate":true}`.

## Route contract

`POST /api/webhooks/stripe` runs on the Node.js runtime and:

1. returns **503** when Stripe is not configured,
2. returns **400** when `stripe-signature` is missing or invalid,
3. returns **200** with `{ received: true, duplicate }` after recording the event.

`recordPaymentEvent` inserts the row into `PaymentEvent` by the unique
`stripeEventId`. A repeated delivery is detected before any order work happens,
so Stripe's at-least-once delivery cannot duplicate side effects.

For `payment_intent.succeeded` with `metadata.orderId`, the same transaction:

- marks the order `PAID` (status and payment status), sets `paidAt` and the
  PaymentIntent id, and appends an `OrderStatusHistory` row;
- decrements stock for each order item with a `stock >= quantity` guard. If any
  item cannot be covered, the transaction throws and the event is not stored, so
  Stripe retries instead of losing the payment.

`payment_intent.payment_failed` stores the event only; the order stays `UNPAID`.

`restoreStockForCancelledOrder` returns the items to stock exactly once when an
order moves to `CANCELLED`.

## Security notes

- Webhook payloads are verified with `stripe.webhooks.constructEvent` before any
  database access.
- Mutating browser APIs call `assertSameOrigin`, which rejects an `Origin` that
  does not match the request host.
- `next.config.mjs` sets `X-Frame-Options: DENY`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a restrictive
  `Permissions-Policy`.
- The real secret keys stay in the git-ignored `.env`; only placeholders are
  committed.
