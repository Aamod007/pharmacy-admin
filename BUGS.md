# Defect & Bug Tracking Ledger: Pharmico Admin Center

| Bug ID | Severity | Module / Area | Description | Root Cause File & Line | Status | Regression Test |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **BUG-01** | **P0** | Auth / Security | Frontend authentication bypassed with mock `defaultAdmin` user, hardcoded `bypass-token`, and auto-redirecting `LoginPage` | `apps/admin-web/src/app/(auth)/login/page.tsx:9` & `apps/admin-web/src/store/authStore.ts:39` | **FIXED** (commit `821de11`) | `tests/e2e/admin-flow.spec.ts` |
| **BUG-02** | **P2** | Add Product / Wizard | Card heading in Add Product form mismatched specification ("Medicine Media" vs "Product Media") causing test failure | `apps/admin-web/src/app/(dashboard)/products/add/page.tsx:1049` | **FIXED** (commit `821de11`) | `tests/e2e/admin-flow.spec.ts` |
| **BUG-03** | **P2** | Tooling / Linting | Broken ESLint configuration across `admin-api` and `admin-web` preventing CI checks | `apps/admin-api/.eslintrc.json` & `apps/admin-web/.eslintrc.json` | **FIXED** (commit `821de11`) | `npm run lint` |
| **BUG-04** | **P1** | Inventory Core | Missing Feature: Standalone Add/Edit/Delete Batch endpoints & UI on existing product variants | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S2) |
| **BUG-05** | **P1** | Inventory Core | Missing Feature: Supplier Purchase Entry workflow (`admin_purchase_entries`, invoice deduplication, stock increase) | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S4) |
| **BUG-06** | **P1** | Inventory Core | Missing Feature: Expiry write-off ledger action & IST boundary 30/60/90 days alerts | `apps/admin-api/src/modules/inventory/inventory.service.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S6) |
| **BUG-07** | **P1** | Inventory Core | Missing Feature: CSV batch import/export with formula injection defense and duplicate SKU handling | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S10) |
| **BUG-08** | **P2** | Inventory Core | Missing Feature: Stock Valuation (purchase vs selling) and Dead Stock breakdown reports | `apps/admin-api/src/modules/inventory/inventory.service.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S11) |
| **BUG-09** | **P1** | Inventory Core | Interactive transaction timeout on Supabase transaction pooler during heavy inventory operations | `apps/admin-api/src/modules/inventory/inventory.service.ts:10` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S2-S9) |
| **BUG-10** | **P0** | Orders / Audit | Order status update foreign key violation (`OrderStatusHistory_changedByUserId_fkey`) when admin user mutates order | `apps/admin-api/src/modules/orders/orders.service.ts:218` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S8) |
| **BUG-11** | **P0** | Inventory Concurrency | Race condition in concurrent order allocations causing stale ledger `newStock` values and Invariant I2 violation | `apps/admin-api/src/modules/inventory/inventory.service.ts:380` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S9) |
| **BUG-12** | **P0** | Storefront / Cart Abandonment | Abandoned order timeout cancellation restored stock to arbitrary batch without `admin_stock_movements` ledger entry | `apps/admin-api/src/modules/orders/orders.service.ts:173` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S8) |

---

### Detailed Defect Reports

#### BUG-01: Frontend Authentication Bypassed & Login Form Removed
- **Severity**: P0 (Security & Broken Authentication)
- **Steps to Reproduce**:
  1. Navigate to `http://localhost:3002/login`.
  2. Observe that no login form is rendered; user is immediately redirected to `/` with message "Authentication removed".
  3. Inspect `authStore.ts` and note `accessToken: "bypass-token"` and `isAuthenticated: true` hardcoded.
- **Expected Behavior**: A secure, statutory login form accepting email, password, and 2FA credentials, authenticating against `POST /api/v1/auth/login`.
- **Actual Behavior**: Completely bypassed auth, breaking E2E tests and production security.
- **Root Cause**: `apps/admin-web/src/app/(auth)/login/page.tsx:9` and `apps/admin-web/src/store/authStore.ts:39`.
- **Fix**: Rebuilt complete `LoginPage` with credentials validation, error state, and 2FA support. Connected to `useAuthStore` with persistent localStorage synchronization.
- **Commit**: `821de11`

#### BUG-09: Interactive Transaction Timeout During Multi-Batch FEFO Allocation
- **Severity**: P1 (Reliability & Performance)
- **Root Cause**: Prisma default interactive transaction timeout is 5000ms. Over Supabase remote transaction pooler (port 6543), complex multi-table queries and ledger updates exceeded 5000ms.
- **Fix**: Applied `{ maxWait: 15000, timeout: 60000 }` to all interactive transactions.

#### BUG-10: Foreign Key Constraint Violation in OrderStatusHistory
- **Severity**: P0 (Data Integrity & Order Flow Broken)
- **Root Cause**: `OrderStatusHistory.changedByUserId` is an FK constraint pointing to storefront customer table `User(id)`. Admin user IDs belong to `AdminUser(id)`.
- **Fix**: Verified user table before assigning `changedByUserId`, setting it to null for staff and recording admin audit identity in `note`.

#### BUG-11: Stock Race Condition & Invariant I2 Mismatch Under High Concurrency
- **Severity**: P0 (Stock Invariants & Race Condition)
- **Root Cause**: Concurrent FEFO allocations read batches optimistically, resulting in simultaneous decrements computing stale `newStock` values for the stock movement ledger.
- **Fix**: Implemented pessimistic row locking (`SELECT ... FOR UPDATE`) in PostgreSQL via Prisma raw transaction query, serializing concurrent allocations.

