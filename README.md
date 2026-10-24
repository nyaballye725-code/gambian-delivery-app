# Jotna — The Gambia, delivered

A multi-role local delivery platform for The Gambia. Customers order from neighbourhood
restaurants and groceries, riders accept and complete deliveries, and the operations team
runs the whole marketplace from one workspace.

Built with Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM and Postgres — with an
embedded PGlite database for zero-setup local runs.

```
customer  →  browse shops → basket → checkout → live order progress
admin     →  shops & menus, inventory, orders, riders, customers, analytics
driver    →  go online → nearby queue → accept → picked up → delivered
```

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

There is **nothing else to configure**. Without `DATABASE_URL` the app creates a local
Postgres-compatible database with [PGlite](https://pglite.dev) in `.data/pglite`, applies the
schema, and seeds demo data on first request. Delete the `.data` folder to start over.

### Demo accounts

All demo accounts use the password **`jotna2026`**. They are also one-click buttons on the
sign-in screen.

| Role     | Email              | What you can do                                        |
| -------- | ------------------ | ------------------------------------------------------ |
| Admin    | `admin@jotna.gm`   | Everything: shops, menus, stock, orders, riders, people |
| Customer | `aisha@jotna.gm`   | Browse, order, track, cancel, edit profile             |
| Driver   | `lamin@jotna.gm`   | Go online, accept deliveries, complete routes          |

Customers can also create their own account from the sign-in screen.

## Using a real Postgres

```bash
cp .env.example .env.local
# set DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
npm run db:push       # optional: generate/push schema with drizzle-kit
npm run dev
```

The app also applies its idempotent schema automatically on first request, so `db:push` is a
convenience for teams that prefer migrations in version control. A ready-made Postgres is
included in `compose.yaml`:

```bash
docker compose up -d db
```

## Roles and flows

**Customer**

- Browse by category, search shops and menus, see live stock ("Only 3 left", "Sold out").
- Basket is single-shop (switching shops asks first), quantities are capped by stock.
- Checkout with delivery address and cash / QMoney / Wave.
- Live progress tracker on the two most recent orders (placed → confirmed → preparing →
  ready → on the way → delivered). Cancel while the order is still pending or confirmed.
- Profile and neighbourhood editing.

**Admin (operations)**

- Overview: weekly order value, order volume, active deliveries, available couriers, 7-day
  chart, top shops, latest orders.
- Shops and menus: create/edit/delete shops, add/edit menu items, toggle availability and
  opening state, stock levels with low-stock highlighting.
- Orders: filter/search, change status, assign a courier, cancel, delete (with restocking).
- Riders: availability, active routes, create/edit/deactivate/reactivate accounts.
- Customers: directory with order counts and lifetime value.

**Driver**

- Online/offline switch; the queue is hidden while offline and the API refuses accepts.
- Nearby queue of unassigned pending/confirmed/ready orders, with pickup, drop-off and payout.
- My deliveries, completed history, delivery earnings for the last 7 days.

## Data & business rules

- **Stock** is reserved atomically when an order is placed (`SELECT … FOR UPDATE`) and returned
  when an order is cancelled or deleted before delivery. It is never double-sold.
- **Order lifecycle** is enforced server-side: riders can only accept unassigned open orders,
  only move `ready → picked_up` and `picked_up → delivered`; customers can only cancel their own
  `pending`/`confirmed` orders; delivered and cancelled orders are final.
- **Money** is stored in whole Gambian Dalasi (integers), never floats. Order totals are always
  computed on the server from current catalogue prices.
- **Access control** is checked in every route handler from a signed, HttpOnly session cookie.

## API

All endpoints return JSON. Mutations require a session unless noted.

| Method | Route                  | Access                | Purpose                                   |
| ------ | ---------------------- | --------------------- | ----------------------------------------- |
| GET    | `/api/health`          | public                | Readiness probe (database + schema)       |
| POST   | `/api/auth/login`      | public                | Sign in, rate limited                     |
| POST   | `/api/auth/register`   | public                | Customer signup, rate limited             |
| POST   | `/api/auth/logout`     | public                | Clear session                             |
| GET    | `/api/auth/me`         | session               | Current user                              |
| PATCH  | `/api/auth/me`         | session               | Update own profile / rider availability   |
| GET    | `/api/stores`          | session               | Open shops (all shops for admins)         |
| POST   | `/api/stores`          | admin                 | Create shop                               |
| PATCH  | `/api/stores/:id`      | admin                 | Update shop / open state                  |
| DELETE | `/api/stores/:id`      | admin                 | Delete shop (menu cascades)               |
| GET    | `/api/products`        | session               | Menu items, optional `?storeId=`          |
| POST   | `/api/products`        | admin                 | Create menu item                          |
| PATCH  | `/api/products/:id`    | admin                 | Update item / availability / stock        |
| DELETE | `/api/products/:id`    | admin                 | Remove menu item                          |
| GET    | `/api/orders`          | session               | Role-scoped order list with items         |
| POST   | `/api/orders`          | customer              | Place an order (validates stock)          |
| PATCH  | `/api/orders/:id`      | role dependent        | Status, courier assignment, accept        |
| DELETE | `/api/orders/:id`      | admin / owner         | Remove order and restore stock            |
| GET    | `/api/users`           | admin                 | Accounts, optional `?role=`               |
| POST   | `/api/users`           | admin                 | Create rider/customer                     |
| PATCH  | `/api/users/:id`       | admin                 | Edit, reactivate, reset password          |
| DELETE | `/api/users/:id`       | admin                 | Deactivate account (history is kept)      |

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Development server on `0.0.0.0:3000`               |
| `npm run build`     | Production build                                   |
| `npm start`         | Start the production build                         |
| `npm run check`     | TypeScript + ESLint                                |
| `npm run test:api`  | End-to-end API test against a running server       |
| `npm run db:push`   | Push the Drizzle schema to `DATABASE_URL`          |
| `npm run db:generate` | Generate SQL migrations into `drizzle/`          |
| `npm run db:studio` | Open Drizzle Studio                                |

The API test covers signup, sessions, catalogue, stock reservation, cancellation and
restocking, the full delivery lifecycle, and every role's permissions:

```bash
npm run dev            # in one terminal
npm run test:api       # in another
```

## Configuration

| Variable             | Default                    | Notes                                                     |
| -------------------- | -------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`       | _(unset)_                  | Unset → embedded PGlite in `.data/pglite`                 |
| `DATABASE_POOL_SIZE` | `10`                       | Max pooled Postgres connections                           |
| `SESSION_SECRET`     | generated in `.data` (prod) | **Set this** in production; must be shared by all instances |
| `PGLITE_DATA_DIR`    | `.data/pglite`             | Embedded database location                                |

## Project structure

```
src/
  app/
    api/            route handlers (auth, stores, products, orders, users, health)
    dashboard.tsx   the whole client app (role-aware workspace)
    globals.css     design system and responsive layout
    layout.tsx      metadata and document shell
    page.tsx        mounts the dashboard
  db/
    index.ts        lazy Postgres/PGlite connection
    bootstrap.ts    idempotent schema application (advisory-locked)
    ddl.ts          schema DDL kept in step with schema.ts
    schema.ts       Drizzle table definitions
  lib/
    auth.ts         HMAC session cookies, scrypt password hashing
    demo-data.ts    demo seed + password hashing helpers
    order-query.ts  role-scoped order queries and hydration
    rate-limit.ts   login/signup throttling
scripts/
  api-smoke-test.mjs
```

## Deployment notes

- Run `npm run build` then `npm start`. Set `DATABASE_URL` and `SESSION_SECRET`.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- The embedded PGlite database is intended for local development and previews: it lives on
  local disk and does not share state across instances.
- The rate limiter is in-memory; use Redis or a platform WAF when running many instances.
- Payments are simulated (cash / QMoney / Wave labels). No payment provider is integrated.

## Not included (deliberately out of scope)

Password reset email delivery, push/SMS notifications, saved addresses, shop-owner accounts,
card payments, and a public marketing site.
