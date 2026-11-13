# P2 schedule — weeks 3 to 12

Status at the end of week 7 (P2 submission). Each week lists the work that was
planned at P1, what actually shipped, and who owned it. "Done" means the code is
merged, the tests pass and the behaviour was demonstrated in the running app.

| Week | Planned | Delivered | Owner | Status |
| --- | --- | --- | --- | --- |
| 3 | P1 presentation, repository, README, stack decision | Next.js 14 + React + Tailwind + Node + MySQL + Stripe chosen; public repository created; P1 deck presented | All | done |
| 4 | ERD, endpoint list, wireframes, repository workflow | 13-model Prisma schema frozen; 30 endpoints listed with access levels; 5 wireframes; three feature branches agreed | All | done |
| 5 | Foundation, seed data, A1 catalog, A4 accounts | Next.js foundation, project-local MySQL 8.0.36 on port 3307, 32 seeded editions, catalog/category/product pages, auth and sessions | Cosmin (catalog), Iulian (accounts), Rares (foundation review) | done |
| 6 | A2 search, Stripe setup, login prototype | Search and filters, Stripe SDK and webhook signing secret, register/login/logout with signed httpOnly cookie, address book | Cosmin (search), Rares (Stripe), Iulian (accounts) | done |
| 7 | P2 specification, live prototype, integration | Specification (8 pages), deck (15 slides), ERD/architecture/sequence, wireframes, 14 screenshots, 9 test files, 19 live checks, `p2/integration` and tag `P2` | All | done |
| 8 | A3 cart, A5 checkout | Cart service and UI, checkout screen with delivery methods and server-computed totals | Iulian (cart), Rares (checkout) | next |
| 9 | A6 confirmation, A7 stock, A8 history | PaymentIntent creation, Stripe.js card confirmation, confirmation page reading the database, order history, stock UI states | Rares (payments, stock), Iulian (orders) | planned |
| 10 | A9 admin panel, A10 security hardening | Product and category CRUD with image upload, order list and status transitions, security review and rate limiting | Cosmin (admin), Rares (security) | planned |
| 11 | A11 responsive, A12 tests, B4 + B5 | Responsive pass on every new screen, cart/checkout tests, sales dashboard, discount codes; feature freeze | Cosmin (B4), Iulian (B5) | planned |
| 12 | P3 fixes, backup video, final README | Bug fixes from review, recorded demo, final README and P3 deck | All | planned |

## What P2 proves

- The three riskiest areas are not mocked: catalog, accounts and payments run
  against a real MySQL database, with real password hashes, a real signed
  cookie and real Stripe signature verification.
- The contracts that weeks 8–12 depend on are frozen: schema, endpoints, access
  levels, error shape and the payment sequence.
- The repository workflow works: one branch per member, one author per branch,
  review and merge by the other two, integration branch, `P2` tag.

## Evidence collected in week 7

| Check | Command | Result |
| --- | --- | --- |
| Unit and service tests | `npm test` | 9 files pass |
| Production build | `npm run build` | passes |
| Live app checks | `node scripts/verify-app.mjs` | 19/19 pass |
| Signed webhook, new event | `node scripts/test-webhook.mjs` | order paid, stock −qty, `duplicate: false` |
| Signed webhook, replay | run it twice | `duplicate: true`, no second stock change |
| Invalid signature | send a modified header | `400`, order untouched |
| Seed integrity | `npm run db:verify` | 4 categories, 16 games, 32 editions, 64 images |
| Responsive | screenshots at 360 px | no horizontal scroll on any customer page |

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Payment and stock correctness | Webhook-first confirmation, idempotent `PaymentEvent`, conditional stock decrement inside one transaction, transaction tests |
| Integration pain close to P3 | Contracts frozen at P2, small merges, one integration branch rebuilt from `main` |
| Scope creep | Required features A1–A12 first, feature freeze in week 11, bonuses B4 + B5 scheduled after checkout and admin |
| Demo failure on the presentation machine | Local MySQL instance started by script, seeded data, backup video recorded in week 12 |
