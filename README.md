# Hexora

**Hexora** is an online video game store for PC and console, selling both digital
copies and physical copies. Customers browse and search the catalog, create an
account, keep an address book and — from week 9 — pay with a card in Stripe test
mode. The owner manages products and orders from an administration panel.

This repository is the **P2 deliverable** (week 7) of the E-Commerce course:

| Deliverable | File |
| --- | --- |
| Specification, 8 A4 pages | `P2 - Hexora Specification.pdf` |
| Deck, 15 slides | `P2 - Hexora.pdf` and editable `P2 - Hexora.pptx` |
| ERD, architecture, payment sequence | `docs/deliverables/*.svg` and `*.png` |
| Wireframes, five screens | `docs/deliverables/wireframes.html` |
| Screenshots, 1440 px and 360 px | `docs/screenshots/` |

Repository: <https://github.com/Iordachescu-Iulian/Project-E-commerce>

## What works at P2

The prototype is not a mock-up: every screen below reads and writes the MySQL
database on `127.0.0.1:3307`.

| Requirement | Status at P2 | Notes |
| --- | --- | --- |
| A1 Product catalog | working | Home, catalog with pagination (24/page), category pages, product page with gallery and sibling edition |
| A2 Search | working | Name search plus category, platform, format and sort filters, all in the URL |
| A3 Shopping cart | contract | Data model and endpoints frozen; screens arrive in weeks 8–9 |
| A4 User accounts | working | Register, login, logout, bcrypt hashes, signed httpOnly session, address book with one default address |
| A5 Checkout | contract | Delivery methods and totals are seeded; checkout screen in weeks 8–9 |
| A6 Sandbox payment | service working | Signature-verified Stripe webhook stores each event once and marks the order paid; card UI follows the checkout screen |
| A7 Stock management | service working | Conditional decrement inside the paid transaction, rollback on conflict, restore on cancellation |
| A8 Order history | contract | Endpoints frozen; screens in week 9 |
| A9 Admin panel | contract | ADMIN role and server guards exist; CRUD screens in weeks 10–11 |
| A10 Basic security | foundation working | Zod validation, same-origin guard, security headers, role guards, Prisma parameterisation |
| A11 Responsive design | working | Every customer page usable at 360 px, no horizontal scroll |
| A12 Automated tests | working | 9 Vitest files plus 19 live checks against the running app |
| B4 Sales dashboard | planned | Week 11, after the admin panel |
| B5 Discount codes | planned | Week 11, after checkout |

Full detail, including the frozen ERD, endpoint table and acceptance evidence,
is in the specification PDF.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Next.js 14 App Router, Tailwind CSS 3 |
| Backend | Next.js route handlers on Node.js 18+ |
| Database | MySQL 8.0.36 through Prisma 5.22 |
| Payments | Stripe 17 test mode, webhook-confirmed |
| Auth | bcryptjs passwords, `jose` HS256 session cookie |

## Getting started

Requirements: **Node.js 18.17+** and **MySQL 8.0 server** installed locally
(`mysqld.exe` on `PATH` or in `C:\Program Files\MySQL\MySQL Server 8.0`). The
scripts start a project-local instance; they never touch the MySQL service on
port 3306.

Four commands on a clean checkout (PowerShell, Windows):

```powershell
Copy-Item .env.example .env
npm install
npm run setup
npm run dev
```

`npm run setup` runs `prisma generate`, starts the local instance on port 3307,
applies the schema and seeds the shop. The same steps can be run separately:

```powershell
npm run db:start
npm run db:push
npm run db:seed
```

Open <http://localhost:3000>. Stop the database with `npm run db:stop`.

Environment: copy `.env.example` to `.env` and keep the defaults for the demo.
Stripe values are optional at P2 — without them the webhook answers `503`
instead of failing silently. Set a long random `AUTH_SECRET` for anything
beyond a local demo.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `demo@hexora.test` | `Demo1234!` |
| Administrator | `admin@hexora.test` | `Admin1234!` |

Both rows are seeded with bcrypt hashes by `prisma/seed-users.ts`; the passwords
above exist only in the seed script and the documentation.

### A five-minute demo

1. Home → catalog → filter by category and platform → search `crown`.
2. Open a product: gallery, price, stock, and the link to the sibling edition.
3. Register a new account, add an address, log out and log in again — the
   address is still there.
4. Send a signed Stripe test event with `node scripts/test-webhook.mjs`: the
   order becomes paid and stock drops once. Replay it: `duplicate: true`.
5. Shrink the window to 360 px; the catalog collapses to two columns.

## Data

Seeded by `npm run db:seed`: 4 categories, 16 games, 32 purchasable editions
(digital and physical), 64 generated covers and banners, 2 delivery methods
(digital `0` lei, courier `19.99` lei), 1 discount code and the 2 demo users.
The 13-model Prisma schema is in `prisma/schema.prisma`; every foreign key is
indexed, and order history uses `SetNull` so deleting a product never rewrites
an old order.

## API

Twelve endpoints are implemented at P2:

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/products` | public |
| GET | `/api/products/[slug]` | public |
| GET | `/api/categories` | public |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | authenticated |
| GET | `/api/auth/me` | authenticated |
| GET, POST | `/api/addresses` | customer |
| PATCH, DELETE | `/api/addresses/[id]` | owner |
| POST | `/api/webhooks/stripe` | Stripe signature |

The remaining 18 routes (cart, checkout, orders, delivery methods, discount
validation and the admin surface) are frozen in the specification and ship in
weeks 8–11. Money is always serialised as a decimal string, errors always use
`{ "error": "…" }`, and mutating requests pass through `assertSameOrigin`.

## Verification

```powershell
npm test                      # 9 Vitest files
npm run build                 # production build
node scripts/verify-app.mjs   # 19 live checks, needs the dev server on :3000
node scripts/test-webhook.mjs # signed Stripe events, needs the Stripe variables
```

Screenshots are produced with `node scripts/capture-screenshots.mjs` (Playwright
against Chrome) and the PDFs with `node scripts/render-spec.mjs` and
`node scripts/render-deck.mjs`. The deck source is `docs/deliverables/deck.html`
and the specification source is `docs/deliverables/spec.html`.

## Branches and reviews

Each member wrote one feature branch; the other two reviewed and merged it into
`p2/integration`, which is then merged into `main` and tagged `P2`.

| Member | Branch | Contents | Merged by |
| --- | --- | --- | --- |
| Iordachescu Iulian Daniel | `p2/iulian-accounts` | Register, login, logout, session, addresses | Nica Rares |
| Motroc Cosmin Alexandru | `p2/cosmin-catalog-search` | Seed data, catalog, search, product page | Iordachescu Iulian |
| Nica Rares Octavian | `p2/rares-payments-security` | Security headers, origin guard, Stripe webhook, stock | Motroc Cosmin |
| All | `p2/integration` → `main` | Merge order Iulian → Cosmin → Rares, tag `P2` | Three-person review |

Pull request descriptions are kept in `docs/PR-DESCRIPTIONS.md`; the week-by-week
status is in `docs/P2-schedule.md`; Stripe test cards and webhook commands are in
`docs/payments.md`.

## Team

| Member | P2 role |
| --- | --- |
| Motroc Cosmin Alexandru | Catalog, seed data, administration; integration |
| Nica Rares Octavian | Payments, stock, security |
| Iordachescu Iulian Daniel | Accounts, addresses, shopping flow |

## AI use

AI coding tools were used for **code generation, code review, test scaffolding,
and documentation drafts**. The primary tool was **OpenCode** running the
**DeepSeek V4.1 Flash** model. Every AI-generated change was reviewed, run and
tested by the team before it was merged.
