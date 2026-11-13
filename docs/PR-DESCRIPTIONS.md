# Pull request descriptions

Copy the relevant block into the GitHub pull request form. Each feature branch
is opened against `main`; the other members merge it into `p2/integration`, and
the integration PR brings all three together and is tagged `P2`.

---

## PR 1 — Accounts, sessions and addresses

**Branch:** `p2/iulian-accounts` → `main`
**Author:** Iordachescu Iulian Daniel
**Closes:** A4

### Summary

Implements customer accounts end to end: registration, login, logout, a signed
session cookie and the delivery address book. All state lives in MySQL; nothing
is kept in memory.

### What changed

- `POST /api/auth/register` validates input with Zod, hashes with bcrypt and
  creates the session in the same response.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- HS256 session token signed with `AUTH_SECRET`, stored in an `httpOnly`,
  `SameSite=Lax` cookie; the payload carries only the user id and role.
- Address CRUD (`GET/POST /api/addresses`, `PATCH/DELETE /api/addresses/[id]`)
  with ownership checks: a customer can never read or modify another
  customer's address.
- The first address becomes the default; deleting the default promotes the
  next one in the same transaction.
- Pages: `/login`, `/register`, `/account` with the address list and editor.
- Seed adds the two demo accounts with bcrypt hashes.

### How to test

```powershell
npm install
npm run setup
npm run dev
npm test                     # password, session and address tests
node scripts/verify-app.mjs  # includes the register → login → address flow
```

Manual: register a user, add an address, log out, log in again and confirm the
address is still listed; then try `PATCH /api/addresses/<someone-else-id>` and
expect `403`.

### Acceptance checklist

- [ ] Passwords never leave the server as plain text or hashes.
- [ ] Cookie is `httpOnly`, `SameSite=Lax`, and cleared on logout.
- [ ] Address handlers check ownership before writing.
- [ ] Mutating requests pass `assertSameOrigin`.
- [ ] Errors use `{ "error": "…" }` with the documented status codes.

---

## PR 2 — Seed data, catalog, category pages and search

**Branch:** `p2/cosmin-catalog-search` → `main`
**Author:** Motroc Cosmin Alexandru
**Closes:** A1, A2

### Summary

Adds the shop itself: 16 games in two editions each, a paginated catalog, a
category page, a product page with a gallery and sibling edition, and search
with URL-backed filters.

### What changed

- Seed: 4 categories, 16 games × 2 editions = 32 products, 64 generated SVG
  covers and banners, 2 delivery methods, 1 discount code.
- Catalog at `/catalog`: server-rendered, 24 products per page, filters for
  category, platform and format, sorting, empty state, accessible pagination.
- `/categories/[slug]` reuses the catalog grid with the category fixed.
- `/products/[slug]`: gallery, price, stock state, platform, format and the
  link to the sibling edition via `gameSlug`.
- Search box writes `q` to the URL; the server does a case-insensitive
  `contains` query, so a shared link reproduces the result.
- API: `GET /api/products`, `GET /api/products/[slug]`, `GET /api/categories`.
- `ProductImage` falls back to a local placeholder when a cover is missing and
  a zero-stock edition is visibly out of stock.

### How to test

```powershell
npm run db:seed
npm run dev
npm test                     # catalog query and stock badge tests
```

Manual: `/catalog?category=action-adventure&platform=PC`, then search `crown`,
then open a product and follow the sibling-edition link. Check the grid at
360 px: two columns, no horizontal scroll.

### Acceptance checklist

- [ ] Page size is clamped server-side to 24; `page` and `pageSize` are never
      trusted from the client.
- [ ] Prices are serialised as decimal strings, not floats.
- [ ] Search terms are parameterised through Prisma.
- [ ] Empty and missing-image states are handled, not left blank.
- [ ] No Prisma import outside `src/server/*` and route handlers.

---

## PR 3 — Stripe webhook, idempotent payments and security headers

**Branch:** `p2/rares-payments-security` → `main`
**Author:** Nica Rares Octavian
**Closes:** A6, A7 (service level), foundation of A10

### Summary

Makes payment confirmation trustworthy. Only a signature-verified Stripe event
can mark an order paid, each event is stored exactly once, and stock moves
inside the same transaction.

### What changed

- `POST /api/webhooks/stripe` verifies `stripe-signature` with
  `stripe.webhooks.constructEvent`; missing or invalid signatures return `400`.
- `PaymentEvent.stripeEventId` is unique, so a Stripe retry returns
  `{ "received": true, "duplicate": true }` without touching orders or stock.
- `recordPaymentEvent` runs order status, payment status, `paidAt`, stock
  decrement and status history in one `$transaction`; an unknown order rolls
  everything back and returns `500` so Stripe can retry.
- Conditional stock decrement (`stock >= quantity`) prevents overselling.
- `restoreStockForCancelledOrder` restores stock exactly once when an order is
  cancelled.
- `next.config.mjs` adds security headers; `src/lib/security.ts` exposes
  `assertSameOrigin` and `jsonError`.
- `docs/payments.md` documents test cards, the CLI command and the signing
  secret; `scripts/test-webhook.mjs` sends signed events.

### How to test

```powershell
# .env: STRIPE_SECRET_KEY=sk_test_…, STRIPE_WEBHOOK_SECRET=whsec_…
npm test                     # signature, idempotency and stock tests
node scripts/test-webhook.mjs    # new event: paid, stock -qty
node scripts/test-webhook.mjs    # same event: duplicate true
```

Then send an event with a broken signature and confirm `400` and an unchanged
order; send one with an unknown `orderId` and confirm the transaction rolled
back.

### Acceptance checklist

- [ ] No route marks an order paid without a verified signature.
- [ ] Replaying an event cannot move stock twice.
- [ ] Stock cannot go negative under concurrent events.
- [ ] Failed transactions leave no partial `PaymentEvent` row.
- [ ] Secrets are read from `.env`; no key is committed and only the
      publishable key can reach the browser.

---

## PR 4 — P2 integration and deliverables

**Branch:** `p2/integration` → `main`
**Author:** all three, merged in the order Iulian → Cosmin → Rares
**Closes:** P2

### Summary

Integrates the three feature branches, aligns shared contracts, adds the P2
documents and the verification tooling, and tags the result `P2`.

### What changed

- Merged `p2/iulian-accounts`, `p2/cosmin-catalog-search` and
  `p2/rares-payments-security` with no manual conflict resolution.
- Specification (`P2 - Hexora Specification.pdf`, 8 pages) and deck
  (`P2 - Hexora.pdf`, `P2 - Hexora.pptx`, 15 slides) with their HTML sources.
- ERD, architecture and payment-sequence diagrams as SVG and PNG; five
  wireframes.
- 14 screenshots at 1440 px and 360 px.
- `scripts/verify-app.mjs` (19 live checks), `scripts/capture-screenshots.mjs`,
  the PDF/diagram renderers and `docs/P2-schedule.md`.
- README rewritten with the four-command setup, demo accounts, status table and
  AI declaration.

### How to test

```powershell
npm run setup
npm test
npm run build
npm run dev
node scripts/verify-app.mjs
```

Expected: 9 test files pass, the build passes, 19/19 live checks pass, and the
seeded database reports 4 categories, 16 games, 32 editions, 64 images.

### Acceptance checklist

- [ ] All three branches merged without losing a feature.
- [ ] Seed counts match the specification.
- [ ] Both PDFs have the expected page count (15 and 8).
- [ ] README commands work from a clean checkout.
- [ ] `P2` tag points at the integration merge on `main`.
- [ ] AI use is declared in the README.
