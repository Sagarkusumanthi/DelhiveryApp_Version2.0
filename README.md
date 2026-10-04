# Giftly

A gift-delivery marketplace app: customers order gifts from local stores,
stores manage and fulfil those orders, and admins oversee the platform.

This repo is split into two parts:

```
giftly-repo/
├── backend/     Express + TypeScript + Prisma API, backed by PostgreSQL
├── frontend/    The interactive HTML app, wired to the API above
│                (see "Current status" below)
└── docker-compose.yml   Local Postgres for development
```

## Current status

- **`backend/`** is a real API with a Postgres schema modelling every entity
  the prototype used to keep in memory: cities, categories, stores,
  products, users, orders (with items + status history), reminders, and
  group gifts.
- **`frontend/index.html`** is wired to this API. It keeps its original
  in-memory `DB` object, but that object is now a *local cache*: populated
  from the API at boot (`bootstrapReferenceData()`, `bootstrapUserData()`)
  and kept in sync by calling the API first and merging the confirmed
  response back into `DB` on every write (`apiFetch()`, `upsertLocalOrder()`,
  `persistField()`). Nothing else in the file needed to change — rendering,
  cart math, timelines, and admin analytics all still just read `DB.*`
  synchronously, same as before.
  - Covered end-to-end: login, browsing stores/products, cart → checkout →
    order placement, store accept/reject/advance, admin override, delivery
    photo confirmation, reminders (create/edit/delete), group gifts (create
    + mark contribution paid), and every admin/store-owner quick-toggle
    (product availability/featured, store open/closed) and profile edit
    (product details, store profile).
  - `window.GIFTLY_API_BASE` can be set before the script runs to point the
    frontend at a non-default API URL (defaults to `http://localhost:4000`).

## Getting started

### 1. Start Postgres

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with user/password/db all set to
`giftly` (see `docker-compose.yml`).

### 2. Configure and install the backend

```bash
cd backend
cp .env.example .env     # defaults already match docker-compose.yml
npm install
```

### 3. Create the schema and seed demo data

```bash
npm run prisma:migrate   # creates tables from prisma/schema.prisma
npm run seed             # loads the same demo stores/products/users the prototype used
```

### 4. Run the API

```bash
npm run dev
```

The API listens on `http://localhost:4000` by default. Check `GET /health`
to confirm it's up.

## API overview

| Resource | Endpoints |
|---|---|
| Auth (demo-only) | `POST /api/auth/login` |
| Reference data | `GET /api/cities`, `GET /api/categories` |
| Stores | `GET /api/stores`, `GET /api/stores/:id`, `PATCH /api/stores/:id` |
| Products | `GET /api/products`, `GET /api/products/:id`, `PATCH /api/products/:id` |
| Orders | `GET /api/orders`, `POST /api/orders`, `PATCH /api/orders/:id/status`, `PATCH /api/orders/:id/override`, `PATCH /api/orders/:id/delivery-confirmation` |
| Reminders | `GET /api/reminders`, `POST /api/reminders`, `PATCH /api/reminders/:id`, `DELETE /api/reminders/:id` |
| Group gifts | `GET /api/group-gifts`, `POST /api/group-gifts`, `POST /api/group-gifts/:id/contributors`, `PATCH /api/group-gifts/:id/contributors/:contributorId` |

## Known gaps to close before this is production-ready

- **Auth is demo-grade.** `User.password` is stored in plaintext and
  `/api/auth/login` does a direct string comparison, matching the original
  prototype's hardcoded demo accounts. Replace with hashed passwords
  (bcrypt/argon2) and real session/JWT issuance before real users touch it.
- **No authorization checks yet.** Any client can currently call the store
  or admin endpoints (e.g. `PATCH /api/orders/:id/override`). Add
  role-based middleware once auth is real.
- **Order codes** are generated from `COUNT(*)`, which is fine for a single
  demo instance but not safe under concurrent writes — switch to a Postgres
  sequence if/when this needs to handle concurrent order creation.
- **No session persistence.** The frontend keeps the logged-in user only in
  an in-memory `state` object — refreshing the page returns to the login
  screen. Add a token (from a real `/api/auth/login`) stored in
  `localStorage` or a cookie once auth is real.
- **CORS is wide open** (`cors()` with no options in `backend/src/index.ts`).
  Fine for local development; restrict it to your actual frontend origin(s)
  before deploying anywhere public.
- **Price snapshots aren't surfaced yet.** `OrderItem.priceAtOrder` is
  captured correctly in the database at order time, but the frontend still
  looks up the product's *current* price when displaying past orders
  (matching the original prototype's behaviour). Low-risk for a demo, but
  worth switching to `priceAtOrder` so historical orders stay accurate if a
  product's price later changes.
