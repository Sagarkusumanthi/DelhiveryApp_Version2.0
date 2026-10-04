This repo is created for claude development (Claude HP laptop)



# Giftly

A gift-delivery marketplace app: customers order gifts from local stores,
stores manage and fulfil those orders, and admins oversee the platform.

## Stack

- **Next.js 14** (App Router) — pages and API routes in one deployment,
  Vercel's native target.
- **Prisma 6 with driver adapters** (`@prisma/adapter-pg` + `pg`) instead of
  Prisma's native query engine binary. This is the deliberate, correct
  choice for Vercel: serverless functions don't reliably support native
  binaries across regions/runtimes, so queries go through the plain `pg`
  JS driver instead.
- **PostgreSQL**, with a pooled connection (`DATABASE_URL`) for runtime
  queries and a direct connection (`DIRECT_URL`) for migrations.
- **Tailwind CSS** + a small set of Radix-based UI primitives
  (`components/ui/*`) — buttons, inputs, dialogs, tabs, etc.
- **Zod** for request validation, **jose** for signed JWT session cookies,
  Node's built-in `crypto.scrypt` for password hashing.
- **Vitest** for unit tests.

## Project layout

```
giftly/
├── app/
│   ├── api/**/route.ts     REST API — each file is a Vercel serverless function
│   ├── login/               sign-in page
│   ├── (customer pages)     /, /stores/[id], /products/[id], /cart,
│   │                        /checkout, /orders, /orders/[id]/{track,confirmed},
│   │                        /reminders, /group-gifts/**
│   ├── store/**              store-owner area (dashboard, products, orders, profile)
│   └── admin/**              admin area (dashboard, orders, stores, products)
├── components/                shared UI (header/nav shells, cards, ui/* primitives)
├── lib/
│   ├── db.ts                  Prisma client via the pg driver adapter
│   ├── jwt.ts, session.ts      session cookie signing/verification
│   ├── password.ts             scrypt password hashing
│   ├── validation.ts            Zod schemas
│   ├── constants.ts
│   └── services/**             business logic the routes call into
├── middleware.ts                session + role-based route protection
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── tests/unit/**                 Vitest tests
```

Each role has its own area, enforced by `middleware.ts`: `/` and friends for
`CUSTOMER`, `/store/**` for `STORE_OWNER`, `/admin/**` for `ADMIN`. Signing
in sets an httpOnly JWT cookie (`lib/jwt.ts`); there is no client-side
role switch — the session cookie is the only source of truth.

## Local development

### 1. Get a Postgres database

Any Postgres works for local dev — a quick option:

```bash
docker run --name giftly-postgres -e POSTGRES_USER=giftly -e POSTGRES_PASSWORD=giftly \
  -e POSTGRES_DB=giftly -p 5432:5432 -d postgres:16-alpine
```

### 2. Configure and install

```bash
cp .env.example .env
# For the docker command above:
#   DATABASE_URL="postgresql://giftly:giftly@localhost:5432/giftly"
#   DIRECT_URL="postgresql://giftly:giftly@localhost:5432/giftly"
# Generate SESSION_SECRET with: openssl rand -base64 32
npm install   # also runs `prisma generate` via postinstall
```

### 3. Create the schema and seed demo data

```bash
npm run db:migrate:dev
npm run db:seed
```

Seeded demo accounts (all use password `Demo@1234`):

| Role | Email |
|---|---|
| Customer | `customer@giftapp.demo` |
| Store Owner | `store@giftapp.demo` |
| Admin | `admin@giftapp.demo` |

### 4. Run it

```bash
npm run dev
```

Open `http://localhost:3000`.

### Tests

```bash
npm test
```

## Deploying to Vercel

Pushing this repo to GitHub is step one; **connecting it to Vercel is a
separate step that happens in your Vercel account**, which nothing here can
do on your behalf.

1. **Get a Postgres database reachable from the internet.** Use
   [Neon](https://neon.tech) (available directly from the Vercel Marketplace),
   [Supabase](https://supabase.com), or Vercel Postgres. Each gives you a
   pooled connection string (`DATABASE_URL`) and a direct one (`DIRECT_URL`).
2. **Run the migration once**, from your own machine (not on Vercel): set
   `DATABASE_URL`/`DIRECT_URL` in `.env` to the real database, then:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
3. **In Vercel:** New Project → Import this GitHub repo → Vercel
   auto-detects Next.js, no build settings to change → add `DATABASE_URL`,
   `DIRECT_URL`, and `SESSION_SECRET` under Project Settings → Environment
   Variables → Deploy.
4. Every future push to `main` redeploys automatically.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Reference data | `GET /api/cities`, `GET /api/categories` |
| Catalogue | `GET /api/stores`, `GET /api/stores/:id`, `GET /api/products`, `GET /api/products/:id` |
| Customer orders | `GET/POST /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/confirm-delivery` |
| Reminders | `GET/POST /api/reminders`, `PATCH/DELETE /api/reminders/:id` |
| Group gifts | `GET/POST /api/group-gifts`, `GET /api/group-gifts/:id`, `POST .../contributors`, `PATCH .../contributors/:id` |
| Store owner | `GET /api/store/orders`, `GET /api/store/orders/:id`, `PATCH .../transition`, `GET/PATCH /api/store/products`, `PATCH /api/store/products/:id`, `GET/PATCH /api/store/profile` |
| Admin | `GET /api/admin/dashboard`, `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PATCH .../override`, `PATCH /api/admin/products/:id`, `PATCH /api/admin/stores/:id` |

## Known gaps to close before this is production-ready

- **No automated authorization tests** beyond the middleware's role gating —
  worth adding integration tests (e.g. a customer can't fetch another
  customer's order by id) before this handles real users.
- **Order codes** are generated from `COUNT(*)`, fine for low traffic but
  not safe under concurrent writes — switch to a Postgres sequence if this
  needs to handle concurrent order creation.
- **Cart is client-side only** (localStorage, no server-side cart model) —
  matches the original prototype's behaviour but means an abandoned cart
  doesn't survive a device switch.
- **Price snapshots aren't surfaced in the UI.** `OrderItem.priceAtOrder` is
  captured correctly at order time, but product price displays elsewhere
  show the *current* price. Low-risk for a demo, worth revisiting if
  product prices will actually change over time.

<!-- CI dependency maintenance enabled. -->
