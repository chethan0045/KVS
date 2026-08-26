# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KVS Bricks Management System — a full-stack app for running a brick factory: production, kiln loading/firing, sales, employee wages, customer accounts, and husk (fuel) purchases.

- **Frontend**: Angular 17 (standalone components, inline templates, Reactive Forms, Bootstrap 5, PWA service worker)
- **Backend**: Node.js + Express (`backend/server.js`, port 3000 or `PORT`)
- **Database**: MongoDB Atlas via Mongoose (connection string hardcoded in `backend/db/database.js`, database name `kvs`)

## Commands

```bash
# Root (convenience scripts)
npm run install-all     # npm install in backend/ and frontend/
npm run build           # production build of frontend
npm start               # start backend (which also serves the built frontend)

# Backend
cd backend && npm run dev    # nodemon
cd backend && npm start      # node server.js

# Frontend
cd frontend && npm start     # ng serve on :4200 (see caveat below)
cd frontend && npm run build # ng build (defaultConfiguration is production)
```

There are no tests and no linter configured in either package.

**Dev workflow caveat**: `ApiService`/`AuthService` use relative URLs (`/api/...`) and there is **no dev proxy configured** (no `proxy.conf.json`, no `proxyConfig` in `angular.json`). `ng serve` alone cannot reach the API. The working way to run the app is to build the frontend and open the backend: `npm run build && npm start` from the root, then browse `http://localhost:3000`. Express serves `frontend/dist/bricks-management-system/browser` with a `*` catch-all to `index.html` for SPA routing.

The production build registers an Angular service worker (`ngsw-config.json`), so browsers may cache old builds — hard-refresh when a rebuilt frontend doesn't show changes.

## Architecture

### Domain flow

```
Brick Production → Kiln Loading → Kiln Manufacture → Brick Sales
                        │
                        └── Archive (per kiln_number, destructive snapshot)
Side ledgers: Employees + WagePayments, Customers, HuskLoads
```

Note: `KilnLoading` is **not** linked to `BrickProduction` by ObjectId — kilns are identified by free-form `kiln_number` strings. `KilnManufacture.kiln_loading_id` and `BrickSale.kiln_loading_id` do reference `KilnLoading`; sales also reference `Customer` and driver/helper `Employee`s.

### Auth

- `/api/auth/*` is public; every other `/api/*` route is behind `authMiddleware` (JWT Bearer, 7-day expiry). JWT secret is hardcoded in `backend/middleware/auth.js`.
- Two login flows in `backend/routes/auth.js`: email OTP (nodemailer with hardcoded Gmail credentials; pending OTPs live in an in-memory `Map`, so a server restart invalidates them) and email+password (bcryptjs). Users are only written to MongoDB after OTP verification.
- Frontend: token + user in `localStorage` (`AuthService`), `authInterceptor` attaches the Bearer header and redirects to `/login` on any 401, `authGuard` protects every route, `loadingInterceptor` + `LoadingService` drive a global spinner in `AppComponent`.
- There is no `.env` mechanism; the only env var used is `PORT`. Mongo URI, JWT secret, and Gmail credentials are hardcoded in the files named above.

### Denormalized running totals (the most important backend pattern)

Route handlers maintain aggregate fields on related documents and must keep **add/reverse symmetry**:

- Creating a record adds to totals; updating reverses old values then applies new ones; deleting reverses them. See the `addWages.../reverseWages...` helper pairs at the top of `routes/production.js`, `routes/kiln-loading.js`, `routes/kiln-manufacture.js`, `routes/brick-sale.js`.
- `Employee.total_wages_earned` / `balance` accumulate wages from all four stages; `POST /api/employees/:id/pay` records a `WagePayment` and bumps `total_paid`.
- `Customer.total_bricks_bought` / `total_amount` / `balance` are updated by brick-sale routes; `POST /api/customers/:id/pay` bumps `total_paid`.
- `KilnLoading.quantity_sold` is incremented/decremented by sales; sale creation validates against remaining stock (`quantity_loaded - quantity_sold`).

When editing any of these routes, every code path that writes a record must have a matching reversal path, or ledger balances silently drift.

### Wage rates are hardcoded and duplicated

Changing a rate means updating **all** of these places (the report/dashboard recompute wages from quantities rather than reading stored totals):

- Production: quantity × **1.2** — `routes/production.js` (`WAGE_RATE`), `routes/wages-report.js`, `routes/dashboard.js` (aggregation `$multiply`)
- Kiln loading: quantity_loaded × **0.60** — `routes/kiln-loading.js` (POST and PUT)
- Sale delivery: driver **750** / helper **500** defaults — `models/BrickSale.js`, `routes/brick-sale.js`, `routes/wages-report.js` (twice: live + archived)

### Kiln lifecycle & archiving

- `KilnLoading.status`: `loading` → `firing` → `ready`. `PATCH /api/kiln-loadings/:id/status` updates **all** loadings sharing that `kiln_number`. New loadings are blocked while any loading for that kiln is `firing`/`ready`.
- `POST /api/archives` (the "old records" feature) snapshots every loading, manufacture, and sale for a `kiln_number` into one `Archive` document as plain objects, then **deletes the originals**. Both `wages-report.js` and `dashboard.js` merge archived data back into their numbers — any new aggregate must account for archives too.

### Frontend conventions

- Every page is a single self-contained `*.component.ts` (~300–550 lines) with inline template and styles: its own table, Bootstrap modal form (Reactive Forms), delete confirmation, and floating alert. Follow this pattern for new pages; register routes in `app.routes.ts` with `canActivate: [authGuard]`.
- `ApiService` is the single HTTP gateway — add new endpoint methods there, not in components.
- Bootstrap 5 with a brick/terracotta theme (#c0392b, #e74c3c, #8B4513); Font Awesome icons.

## API Endpoints

All under `/api`, JWT-protected except `auth` and `health`:

| Resource | Base path | Notes beyond CRUD |
|---|---|---|
| Auth | `/auth` | `register`, `verify-otp`, `login`, `login/verify`, `register/password`, `login/password` |
| Productions | `/productions` | wages credited to `employee_id` |
| Kiln Loadings | `/kiln-loadings` | `PATCH /:id/status` |
| Kiln Manufactures | `/kiln-manufactures` | |
| Brick Sales | `/brick-sales` | updates customer, kiln stock, driver/helper wages |
| Employees | `/employees` | `POST /:id/pay` |
| Wages Report | `/wages-report` | `?start_date&end_date&employee_id`; merges archives |
| Customers | `/customers` | `GET /search?q=`, `POST /:id/pay` |
| Husk Loads | `/husk-loads` | `POST /:id/pay` |
| Archives | `/archives` | POST archives + deletes a kiln's records |
| Health | `/health` | public |
