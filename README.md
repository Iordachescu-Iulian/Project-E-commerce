# Hexora

**Hexora** is an online video game store for PC and console, selling both
digital copies and physical copies.

The store is simple for customers on any device, and easy for the owner to manage
products and orders.

## Features

- **Product catalog** with search and filters
- **User accounts** and order history
- **Shopping cart** and checkout with two delivery methods: instant digital
  delivery and courier for physical copies
- **Stripe sandbox payments**, confirmed to our server through webhooks
- **Stock management** for both digital and physical products
- **Administration panel** to manage products and orders
- **Basic security** and automated tests

## Tech stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| Frontend  | React, Tailwind CSS                         |
| Backend   | Next.js, Node.js (own API)                  |
| Database  | MySQL                                       |
| Payments  | Stripe (test mode)                          |

## Getting started

1. Copy the environment template and set a local `AUTH_SECRET`:
   `Copy-Item .env.example .env`
2. `npm install`
3. `npm run setup`
4. `npm run dev`

Open <http://localhost:3000>.

`npm run setup` starts the project-local MySQL instance on `127.0.0.1:3307`,
applies the Prisma schema and seeds the shop. The instance stores its data in
`.mysql-data` (gitignored). `npm run db:stop` stops it; the existing MySQL
service on port 3306 is never touched.

MySQL 8.0.36 on Windows cannot reliably place undo tablespaces under a path
containing spaces. The scripts therefore keep only the undo tablespaces in a
no-space sibling directory (`D:\hexora-mysql-undo` by default, or
`HEXORA_MYSQL_UNDO_DIR`). The main data directory stays in `.mysql-data`.

## Scripts

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start the Next.js development server                 |
| `npm run build`     | Production build                                     |
| `npm test`          | Run the Vitest suite                                 |
| `npm run db:start`  | Start the project-local MySQL instance on port 3307  |
| `npm run db:stop`   | Stop the project-local MySQL instance                |
| `npm run db:push`   | Apply the Prisma schema to the local database        |
| `npm run db:seed`   | Reset and seed the local database                    |
| `npm run db:verify` | Verify the seeded shop data                          |

## Team

- **Motroc Cosmin Alexandru**: payments and security
- **Nica Rares Octavian**: catalog and admin
- **Iordachescu Iulian Daniel**: accounts and shopping
