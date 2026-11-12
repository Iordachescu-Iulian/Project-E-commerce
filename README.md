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

## AI use

AI coding tools were used for **code generation, code review, test scaffolding,
and documentation drafts**. The primary tool was **OpenCode** running the
**DeepSeek V4.1 Flash** model. All AI-generated changes were reviewed, tested,
and accepted by the team; the team remains responsible for the final code and
documentation.

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
service on port 3306 is never touched. Both scripts hard-refuse `DB_PORT=3306`.

MySQL 8.0.36 on Windows cannot reliably place undo tablespaces under a path
containing spaces. The scripts therefore keep only the undo tablespaces outside
the repository. The default is `D:\hexora-mysql-undo` (the root of the drive
that contains the repo). Set the `HEXORA_MYSQL_UNDO_DIR` environment variable to
override it; the chosen path must not contain spaces. The undo directory is
marked with the checkout that owns it, and another checkout using the same
directory is refused; set a unique `HEXORA_MYSQL_UNDO_DIR` per checkout when
needed. The main data directory stays in `.mysql-data`.

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
