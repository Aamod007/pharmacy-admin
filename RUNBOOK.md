# Production Operations Runbook: Pharmico Admin Control Center

This runbook provides administrative and DevOps operating procedures for the standalone Pharmico Admin Center.

---

## 1. System Architecture Overview

The Pharmico Admin Center is an enterprise control plane decoupled from the customer storefront (`Medico`):
- **Web Frontend**: Next.js 15 (Turbopack, App Router) running on port `3002`.
- **API Backend**: Node.js 20 + Express + TypeScript running on port `5001`.
- **Primary Datastore**: PostgreSQL (via Prisma ORM `@pharmacy-admin/db`).
- **Distributed Cache & Real-Time Sync**: Redis (Pub/Sub for SSE events, key caching, and revalidation hooks).

---

## 2. Environment Variables & Secret Configuration

Create `.env` at the root by copying `.env.example`:
```bash
cp .env.example .env
```

Key environment configurations:
```ini
# Server Ports
PORT=5001
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1

# PostgreSQL Database (Supabase or direct connection)
DATABASE_URL=postgresql://user:password@host:5432/dbname
DIRECT_URL=postgresql://user:password@host:5432/dbname

# Redis Pub/Sub & Caching
REDIS_URL=redis://localhost:6379

# Cryptographic Authentication Secrets
JWT_ACCESS_SECRET=your-256-bit-access-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret
SESSION_SECRET=your-secure-session-cookie-secret

# Storefront Integration & Revalidation
STOREFRONT_URL=http://localhost:3000
STOREFRONT_REVALIDATE_SECRET=storefront-secret-key-revalidate
```

---

## 3. Starting the Services

### Development Mode (All-in-one):
```bash
npm run dev
```
Launches both `admin-api` (port 5001) and `admin-web` (port 3002) concurrently.

### Individual Service Commands:
- **API Server Only**: `npm run dev:api` (Port 5001)
- **Web UI Only**: `npm run dev:web` (Port 3002)
- **Typecheck All**: `npm run typecheck`
- **Lint All**: `npm run lint`
- **Automated Tests**: `npm test`
- **Playwright E2E**: `npx playwright test`

---

## 4. Database Migrations & Seeding

### Applying Migrations:
```bash
npm run db:migrate
```
Applies pending Prisma migrations to the connected database without dropping existing data.

### Seeding Master Data:
```bash
npm run db:seed
```
Seeds standard roles, default staff accounts, suppliers, categories, and test products.

---

## 5. Health Checks & Diagnostics

### API Availability:
```bash
curl -I http://localhost:5001/api/v1/auth/me
```
Returns `401 Unauthorized` (confirming active auth middleware) or `200 OK` when authenticated.

### Storefront Revalidation Status:
```bash
POST /api/v1/settings/revalidate-now
Headers: Authorization: Bearer <TOKEN>
```
Triggers an immediate revalidation cycle against the configured storefront.

---

## 6. Resilience & Fallback Behaviors

### 1. Redis Connection Failures:
- If Redis is down or unreachable, the Admin API automatically operates in standalone fallback mode:
  - Cache reads bypass cache and fetch directly from PostgreSQL.
  - Revalidation jobs are safely logged and stored in the PostgreSQL retry queue (`admin_settings`).
  - No unhandled crashes or dropped requests occur.

### 2. High-Concurrency Stock Allocation:
- Simultaneous order confirmations enforce row-level pessimistic locking (`SELECT ... FOR UPDATE`) on candidate batches in chronological FEFO order.
- Guarantees zero overselling and prevents Invariant I1/I2 violations during flash sales.

---

## 7. Emergency Incident Response Procedures

### Emergency Batch Recall & Quarantine:
If a pharmaceutical manufacturer issues a statutory recall or contamination alert:
1. Navigate to **FEFO Inventory** (`http://localhost:3002/inventory`).
2. Search for the recalled `batchNumber`.
3. Click **Quarantine Batch**.
4. Enter statutory recall notice ID and reason.
5. The batch is instantly set to `isBlocked = true`, removing it immediately from the allocation pool across both admin fulfillment and storefront checkout.

### Statutory Stock Invariant Audit:
To verify database-wide inventory ledger consistency across all active batches, run:
```bash
npx vitest run tests/unit/inventory-scenarios.test.ts
```
This executes raw SQL verification of Invariants I1 through I6, asserting zero negative stock and 100% ledger balance reconciliation.
