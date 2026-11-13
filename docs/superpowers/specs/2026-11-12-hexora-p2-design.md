# Hexora P2 — Specification and Prototype Design

- **Date:** 2026-11-12
- **Status:** awaiting team approval
- **Stage:** P2 — Specification and Prototype (Week 7)
- **Repository:** https://github.com/Iordachescu-Iulian/Project-E-commerce

## 1. Intent

P2 freezes the specification for the Hexora video game store and proves the
riskiest parts with a working prototype. The stage closes the work planned in
P1 for weeks 4–7: data model, API surface, wireframes, seed data, catalog,
search, accounts and payment setup. The P2 commit becomes the list against
which P3 is graded.

The team has three members. Every member must own and submit their own code,
and the others merge it through GitHub pull requests.

## 2. Goals

- Freeze the implementation approach for A1–A12 and the chosen bonuses B4 + B5.
- Deliver a working prototype with A1 (catalog), A2 (search) and A4 (accounts)
  running against a seeded MySQL database.
- Freeze the complete data model, component architecture and API surface for P3.
- Produce the P2 deck (max 15 slides) and the specification document
  (PDF, max 8 pages), consistent with the P1 visual identity.
- Leave a Git history where each member has their own branch and PR.

## 3. Non-goals

- Cart, checkout, order history, admin panel and automated tests are implemented
  in weeks 8–12, not at P2.
- No real Stripe payment is taken at P2. Week 6 delivers the Stripe test-mode
  configuration and a signature-verified webhook endpoint; the checkout and
  PaymentIntent flow are implemented in weeks 8–9.
- No bonus beyond B4 (sales dashboard) and B5 (discount codes).
- No real invoicing, courier integration, multiple currencies or native apps.

## 4. Constraints

- **Stack fixed by P1:** Next.js, React, Tailwind CSS, Node.js, MySQL, Stripe
  test mode.
- **Runtime on the demo machine:** Node 18.17.0, no Docker, MySQL 8.0.36
  installed as a service but with an unknown root password.
- **Database:** a project-local MySQL 8.0.36 instance on `127.0.0.1:3307`, with
  its data directory inside the project and start/stop scripts. The existing
  MySQL service on port 3306 is not touched.
- **Startup:** at most five commands, following the README.
- **Secrets:** only `.env.example` is committed; `.env` stays local.
- **Responsive:** all customer-facing pages usable at 360 px width.
- **Documents:** deck max 15 slides; specification PDF max 8 pages.
- **AI use:** declared in the README, as required by the course.

## 5. Approaches considered

1. **Next.js full-stack monolith (chosen).** App Router pages and API route
   handlers in one repository, Prisma for data access, Tailwind for UI. It
   matches P1, gives one language for all three members and one process to run.
2. **Separate Express/NestJS API + React SPA.** Cleaner separation, but two
   build/deploy targets and more integration work with no grading benefit.
3. **Django or Laravel.** Mature admin/auth tooling, but contradicts the stack
   already presented in P1 and the team's JavaScript experience.

**Authentication:** custom credentials with bcrypt hashing and a signed,
httpOnly JWT session cookie. Chosen over NextAuth because A4 and A10 require
the team to demonstrate password hashing and server-side authorization, and a
small custom implementation is easier to explain at P3.

**Local database:** project-local MySQL instance on port 3307. Chosen over
resetting the existing service because it needs no administrator rights and
does not risk the user's other databases.

## 6. Architecture

```text
Browser (React / Next.js App Router)
        |
        | HTTPS / fetch
        v
Next.js server (RSC pages + API route handlers)
        |                    |
        | Prisma ORM         | Stripe SDK (server only)
        v                    v
MySQL 8.0.36          Stripe test mode
                             |
                             | signed webhook
                             v
                  POST /api/webhooks/stripe
```

- Server Components render catalog, category and product pages.
- Client Components handle search input, auth forms, address form and the
  future cart/checkout interactions.
- Data access lives in a server-only layer: `src/server/queries/*` for reads
  used by Server Components and `src/server/services/*` for operations used by
  API route handlers. Both use the shared Prisma singleton; Prisma is never
  imported into a Client Component.
- Stripe secret key and webhook secret stay server-side in `.env`.
- Seed product images are generated SVG covers stored in
  `public/images/products`, so the demo has no external image dependency.

## 7. Data model

Entities (full definition in `prisma/schema.prisma`):

- **User** — email, password hash, full name, role (`CUSTOMER` / `ADMIN`).
- **Address** — delivery address belonging to a user, with one default.
- **Category** — slug, name, description.
- **Product** — a purchasable edition: slug, game title, game slug, edition
  label, description, price, stock, platform, format (`DIGITAL` /
  `PHYSICAL`), category, active flag. Digital and physical editions of the
  same game share `gameSlug`, so the product page can show both on one page.
- **ProductImage** — one or more images per product, ordered.
- **Cart / CartItem** — one cart per authenticated user; quantity per product.
- **DeliveryMethod** — at least `DIGITAL` (0 cost) and `COURIER` (fixed cost).
- **Order / OrderItem** — order number, status, payment status, totals,
  delivery address snapshot, product snapshots, Stripe PaymentIntent id.
  Order items are created at checkout, from the server-side cart, and keep a
  price/name snapshot.
- **OrderStatusHistory** — order, previous status, new status, actor, timestamp;
  used by the admin status transitions and the audit trail.
- **PaymentEvent** — unique Stripe event id, type, payload, processed time;
  used for webhook idempotency. Failed payment events are recorded here, not
  as an order status.
- **DiscountCode** — B5: percentage or fixed amount, expiry, max uses, used
  count.

Order statuses: `NEW → PAID → SHIPPED → DELIVERED`, or `CANCELLED`.
Payment statuses: `UNPAID → PAID`, or `REFUNDED`. A failed payment leaves the
order `UNPAID`; the failure is visible in `PaymentEvent`.

Stock rule: stock decreases only inside the webhook transaction that marks the
order `PAID`, using a conditional update (`stock >= quantity`). If the update
affects zero rows, the transaction rolls back and the order stays unpaid. Stock
is restored when an order is cancelled.

## 8. P2 implementation scope and ownership

Roles follow the P1 presentation.

### Shared foundation — `main`

Next.js 14 + TypeScript + Tailwind configuration, Prisma schema, Prisma
singleton, shared API types, base layout and theme, MySQL start/stop scripts,
seed orchestrator, `.env.example`, README skeleton and Git ignore rules.
The foundation also defines the auth contract (`src/lib/auth.ts` with
`getSessionUser`, `requireUser`, `requireRole` and session cookie helpers) as
a compilable stub; Iulian implements the real session and account flows in his
branch. This keeps Cosmin's auth-aware header and Rares' role guard independent
without duplicating files. Authored as the initial team commit.

### Cosmin — catalog and admin lead

- A1: home page, paginated catalog (max 24 per page), category pages, product
  page with name, description, price, images and availability.
- A2: case-insensitive name search with a clear no-results state.
- Seed data: 32 products across 4 categories, each with generated cover art,
  price, stock, platform and format.
- Files: `src/app/(shop)/*`, `src/components/catalog/*`,
  `prisma/seed-products.ts`, `scripts/generate-covers.mjs`.

### Iulian — accounts and shopping lead

- A4: registration, login, logout, bcrypt password hashing, signed httpOnly
  session cookie, account page, create/update default delivery address.
- Seed users: one demo customer and one administrator.
- Server-side guards for authenticated pages and API routes.
- Files: `src/app/(auth)/*`, `src/app/account/*`, `src/app/api/auth/*`,
  `src/app/api/addresses/*`, `src/lib/auth.ts`, `prisma/seed-users.ts`.

### Rares — payments and security lead

- A6 groundwork: Stripe test-mode client and webhook route that verifies the
  `stripe-signature` header, records events idempotently, and calls the
  order/stock service only when the event is valid and references an existing
  order. At P2 the demo uses `stripe trigger`; the checkout that creates real
  orders arrives in weeks 8–9, so the order mutation path is covered by a
  service-level test rather than the live demo.
- A10 groundwork: security headers, same-origin check for mutating requests,
  server-side role guard helper.
- `docs/payments.md` describing the flow and local Stripe CLI testing.
- Files: `src/lib/stripe.ts`, `src/app/api/webhooks/stripe/route.ts`,
  `src/lib/security.ts`, `next.config.mjs`, `docs/payments.md`.

### Integration

Merge the three branches in the order Iulian → Cosmin → Rares, resolve no
expected conflicts (file sets are disjoint), run the app, capture screenshots,
add the P2 deliverables to `docs/`, tag the integration commit `P2`.

## 9. API surface

Implemented at P2:

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/products` | public | Paginated catalog, max 24/page; `q`, `category`, `page` |
| GET | `/api/products/[slug]` | public | Product details with images |
| GET | `/api/categories` | public | Category list |
| POST | `/api/auth/register` | public | Create account |
| POST | `/api/auth/login` | public | Start session |
| POST | `/api/auth/logout` | authenticated | Clear session |
| GET | `/api/auth/me` | authenticated | Current user |
| GET | `/api/addresses` | customer | List own addresses |
| POST | `/api/addresses` | customer | Create address |
| PATCH | `/api/addresses/[id]` | owner | Update address / set default |
| DELETE | `/api/addresses/[id]` | owner | Delete address |
| GET | `/api/delivery-methods` | public | Delivery methods and costs |
| POST | `/api/discounts/validate` | customer | Validate a B5 code for the cart |
| POST | `/api/webhooks/stripe` | Stripe signature | Payment events |

Frozen for P3:

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/cart` | customer | Current cart |
| POST | `/api/cart/items` | customer | Add product, stock-checked |
| PATCH | `/api/cart/items/[id]` | owner | Update quantity |
| DELETE | `/api/cart/items/[id]` | owner | Remove item |
| POST | `/api/checkout` | customer | Validate cart/address, create order + PaymentIntent |
| GET | `/api/orders` | customer | Own order history |
| GET | `/api/orders/[id]` | owner | Order details |
| GET/POST | `/api/admin/products` | admin | List/create products |
| PATCH/DELETE | `/api/admin/products/[id]` | admin | Update/delete product |
| POST | `/api/admin/products/[id]/images` | admin | Upload image |
| GET/POST | `/api/admin/categories` | admin | List/create categories |
| PATCH/DELETE | `/api/admin/categories/[id]` | admin | Update/delete category |
| GET | `/api/admin/orders` | admin | Order list, filter by status |
| GET | `/api/admin/orders/[id]` | admin | Order details and status history |
| PATCH | `/api/admin/orders/[id]/status` | admin | Status transition |
| GET | `/api/admin/dashboard` | admin | B4 sales metrics |
| GET/POST | `/api/admin/discounts` | admin | B5 discount code list/create |
| PATCH/DELETE | `/api/admin/discounts/[id]` | admin | B5 update/delete |

Access levels are enforced on the server, not only hidden in the UI.

## 10. Payment flow (critical flow)

1. Customer submits checkout with address and delivery method.
2. Server reloads the cart, validates stock and totals, creates an order with
   status `NEW` / payment `UNPAID`, and creates a Stripe PaymentIntent.
3. Browser confirms the card with Stripe.js using the test card.
4. Stripe sends `payment_intent.succeeded` to `/api/webhooks/stripe`.
5. The route verifies the signature, stores the event id uniquely and, in one
   transaction, marks the order `PAID`, records `paidAt`, decrements stock
   conditionally and appends the status history. Order items already exist
   from checkout.
6. The confirmation page reads the order from the database and shows the order
   number. A browser redirect alone never marks an order paid.
7. A failed payment leaves the order `UNPAID`; cancellation restores stock.

## 11. Deliverables

- `P2 - Hexora.pptx` — 15 slides: title, status since P1, A1–A12 approaches,
  bonuses B4/B5, ERD, architecture, API endpoints, payment sequence,
  wireframes, prototype screenshots, schedule, risks, Q&A.
- `P2 - Hexora Specification.pdf` — max 8 pages: requirements, bonuses, ERD,
  architecture + endpoints, payment sequence, wireframes, prototype and
  schedule.
- Working app + README with at most five startup commands and demo accounts.
- Screenshots of the live catalog, search, product page, login and account.
- Git branches and PR descriptions for Cosmin, Iulian and Rares.
- Commit tagged `P2` containing the integration and the documents.

## 12. Git workflow

- `main`: shared foundation only.
- `p2/cosmin-catalog-search`: Cosmin's commits.
- `p2/iulian-accounts`: Iulian's commits.
- `p2/rares-payments-security`: Rares' commits.
- Each member pushes their branch and opens a PR against `main`; the other two
  merge it into the integration branch.
- `p2/integration`: local integration branch with all merges, used for the live
  demo and tagged `P2`. After the PRs are merged, `main` matches it.
- Commit author identities use each member's GitHub-linked student email.

## 13. Acceptance criteria for P2

- `npm run setup` followed by `npm run dev` starts the store locally.
- Seed script creates 4 categories, 16 games and 32 purchasable editions
  (digital + physical) with images, prices and stock.
- Catalog is paginated at 24 products per page; category and product pages work;
  the product page shows the sibling edition of the same game.
- Search returns matching products and a clear empty state.
- Registration, login, logout and address saving work; passwords are bcrypt
  hashes; `/account` is blocked without a session.
- The Stripe webhook rejects an invalid signature; a valid test event is stored
  idempotently.
- Pages are usable at 360 px width.
- Deck, PDF, README and schedule are internally consistent with the frozen
  model and API list.
- The repository contains three member branches with their own commits and a
  `P2` tag.

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Project-local MySQL fails to start or port 3307 is busy | Script waits for readiness and supports `DB_PORT` override; Docker compose alternative documented. |
| Node 18.17 incompatibility with newest Next.js | Pin Next.js 14.2.x and React 18. |
| Scope creep at P2 | Freeze code scope to A1, A2, A4 and Stripe skeleton; everything else is specified only. |
| GitHub attribution | Use each member's GitHub-linked email; PRs authored from each account. |
| Demo machine differences | README documents both local MySQL scripts and Docker compose. |

## 15. Resolved design questions

- **Data access:** Server Components use `src/server/queries/*`; route handlers
  use `src/server/services/*`; both share `src/lib/prisma.ts`. Prisma never
  reaches a Client Component.
- **Product shape:** a `Product` is one purchasable edition. Digital and
  physical editions of the same game share `gameSlug`; the product page shows
  both, and the catalog/search can display each edition separately. Seed: 16
  games × 2 editions = 32 products.
- **P2 webhook scope:** signature verification, idempotent `PaymentEvent`
  storage and the order/stock service behind it. Live P2 demo uses
  `stripe trigger`; checkout-created orders arrive in weeks 8–9.
- **Order consistency:** order items are created at checkout; the webhook only
  marks the order paid, decrements stock and appends status history. Payment
  status is `UNPAID` / `PAID` / `REFUNDED`; failures live in `PaymentEvent`.
- **Missing endpoints:** `GET /api/delivery-methods`, `POST
  /api/discounts/validate` and admin discount CRUD are part of the frozen API.
- **Shared contracts:** the foundation provides the Prisma singleton, shared
  API types and the auth contract as a stub; Iulian implements the real auth,
  so Cosmin's header and Rares' role guard compile independently. Merge order:
  Iulian → Cosmin → Rares.

## 16. Decisions left to the builder

- Product names, descriptions, prices, stock levels and generated cover art.
- Exact visual polish of the store while keeping the P1 palette and typography.
- Wording of slides and specification, in English, matching P1.
- Test framework choice for P3 (planned: Vitest for unit/API tests and Playwright
  for the checkout flow).
