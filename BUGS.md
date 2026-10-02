# Master Defect & Bug Tracking Ledger: Pharmico Admin Center

## Summary of Remediated Defects
All 14 identified defects across authentication, statutory inventory, state machine integrity, database constraints, race conditions, and foreign key boundaries have been completely diagnosed, resolved at the root cause, and proved with regression test suites.

| Bug ID | Severity | Module / Area | Description | Root Cause File & Line | Status | Regression Test |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **BUG-01** | **P0** | Auth / Security | Frontend authentication bypassed with mock `defaultAdmin` user, hardcoded `bypass-token`, and auto-redirecting `LoginPage` | `apps/admin-web/src/app/(auth)/login/page.tsx:9` & `apps/admin-web/src/store/authStore.ts:39` | **FIXED** | `tests/e2e/admin-flow.spec.ts` |
| **BUG-02** | **P2** | Add Product / Wizard | Card heading in Add Product form mismatched specification ("Medicine Media" vs "Product Media") causing test failure | `apps/admin-web/src/app/(dashboard)/products/add/page.tsx:1049` | **FIXED** | `tests/e2e/admin-flow.spec.ts` |
| **BUG-03** | **P2** | Tooling / Linting | Broken ESLint configuration across `admin-api` and `admin-web` preventing CI checks | `apps/admin-api/.eslintrc.json` & `apps/admin-web/.eslintrc.json` | **FIXED** | `npm run lint` |
| **BUG-04** | **P1** | Inventory Core | Missing Feature: Standalone Add/Edit/Delete Batch endpoints & UI on existing product variants | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S2) |
| **BUG-05** | **P1** | Inventory Core | Missing Feature: Supplier Purchase Entry workflow (`admin_purchase_entries`, invoice deduplication, stock increase) | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S4) |
| **BUG-06** | **P1** | Inventory Core | Missing Feature: Expiry write-off ledger action & IST boundary 30/60/90 days alerts | `apps/admin-api/src/modules/inventory/inventory.service.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S6) |
| **BUG-07** | **P1** | Inventory Core | Missing Feature: CSV batch import/export with formula injection defense and duplicate SKU handling | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S10) |
| **BUG-08** | **P2** | Inventory Core | Missing Feature: Stock Valuation (purchase vs selling) and Dead Stock breakdown reports | `apps/admin-api/src/modules/inventory/inventory.service.ts` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S11) |
| **BUG-09** | **P1** | Inventory Core | Interactive transaction timeout on Supabase transaction pooler during heavy inventory operations | `apps/admin-api/src/modules/inventory/inventory.service.ts:10` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S2-S9) |
| **BUG-10** | **P0** | Orders / Audit | Order status update foreign key violation (`OrderStatusHistory_changedByUserId_fkey`) when admin user mutates order | `apps/admin-api/src/modules/orders/orders.service.ts:218` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S8) |
| **BUG-11** | **P0** | Inventory Concurrency | Race condition in concurrent order allocations causing stale ledger `newStock` values and Invariant I2 violation | `apps/admin-api/src/modules/inventory/inventory.service.ts:380` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S9) |
| **BUG-12** | **P0** | Storefront / Cart Abandonment | Abandoned order timeout cancellation restored stock to arbitrary batch without `admin_stock_movements` ledger entry | `apps/admin-api/src/modules/orders/orders.service.ts:173` | **FIXED** | `tests/unit/inventory-scenarios.test.ts` (S8) |
| **BUG-13** | **P0** | Security / Auth | Admin API authentication middleware hardcoded to mock Super Admin identity, bypassing JWT verification | `apps/admin-api/src/middlewares/auth.ts:14` | **FIXED** | `tests/integration/security-rbac.test.ts` |
| **BUG-14** | **P2** | Audit Trail | Synthetic or unseeded admin user IDs triggered foreign key constraint failures during audit log recording | `apps/admin-api/src/lib/audit.ts:25` | **FIXED** | `tests/integration/security-rbac.test.ts` |

---

## Detailed Root Cause & Remediation Logs

### BUG-01: Frontend Authentication Bypassed & Login Form Removed
- **Severity**: P0 (Critical Security & Access Control)
- **Root Cause**: `apps/admin-web/src/app/(auth)/login/page.tsx` had been replaced with an auto-redirecting mock screen; `authStore.ts` had a static dummy token `"bypass-token"`.
- **Fix**: Rebuilt complete production `LoginPage` with credentials validation, error alerts, and 2FA flow. Connected to `useAuthStore` with persistent token storage.
- **Verification**: `tests/e2e/admin-flow.spec.ts`

### BUG-09: Interactive Transaction Timeout During Multi-Batch FEFO Allocation
- **Severity**: P1 (Reliability & Database Pooler Latency)
- **Root Cause**: Prisma default interactive transaction timeout is 5000ms. Over Supabase remote pooler connections (port 6543), complex multi-table queries and ledger updates occasionally took ~5200ms, triggering transaction aborted errors.
- **Fix**: Applied explicit `{ maxWait: 15000, timeout: 60000 }` transaction options across `inventory.service.ts` and `orders.service.ts`.
- **Verification**: `tests/unit/inventory-scenarios.test.ts` (S2–S9)

### BUG-10: Foreign Key Constraint Violation in OrderStatusHistory
- **Severity**: P0 (Data Integrity & Fulfillment Failure)
- **Root Cause**: `OrderStatusHistory.changedByUserId` has a foreign key constraint to storefront customer table `User(id)`. Admin user IDs belong to `AdminUser(id)`. Attempting to record admin IDs into `changedByUserId` caused a Prisma FK violation.
- **Fix**: Checked storefront `User` table existence before populating `changedByUserId`; for admin mutations, recorded the admin staff identity in the `note` field while leaving `changedByUserId` null.
- **Verification**: `tests/unit/inventory-scenarios.test.ts` (S8)

### BUG-11: Stock Race Condition & Invariant I2 Mismatch Under High Concurrency
- **Severity**: P0 (Statutory Inventory Integrity & Overselling)
- **Root Cause**: Concurrent FEFO allocations read candidate batches without database row locks, resulting in simultaneous decrements computing stale `newStock` values for the stock movement ledger.
- **Fix**: Implemented pessimistic row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL via Prisma raw interactive transactions, serializing simultaneous batch allocations.
- **Verification**: `tests/unit/inventory-scenarios.test.ts` (S9)

### BUG-12: Storefront Cart Abandonment Bypassed Stock Ledger
- **Severity**: P0 (Audit Trail & Ledger Discrepancy)
- **Root Cause**: Storefront cron cancellations modified batch quantity directly without creating an `admin_stock_movements` RESTOCK ledger record, violating Invariant I5.
- **Fix**: Standardized order state machine cancellations through `ordersService.updateStatus`, which automatically issues atomic RESTOCK movements to the exact original batches.
- **Verification**: `tests/unit/inventory-scenarios.test.ts` (S8)

### BUG-13: Admin API Hardcoded Authentication Bypass
- **Severity**: P0 (Critical Security & Impersonation)
- **Root Cause**: `authenticateAdmin` in `apps/admin-api/src/middlewares/auth.ts` had a temporary stub attaching Super Admin permissions to all incoming requests, bypassing JWT verification.
- **Fix**: Restored cryptographic HS256 JWT verification with algorithm hardening, expiration checking, and database role/permission resolution.
- **Verification**: `tests/integration/security-rbac.test.ts`

### BUG-14: Audit Trail Foreign Key Failure for Unmapped Actors
- **Severity**: P2 (Audit Resiliency)
- **Root Cause**: When tests or background tasks triggered audit events with synthetic actor IDs not yet committed to `AdminUser`, Prisma threw a foreign key violation.
- **Fix**: Added validation in `apps/admin-api/src/lib/audit.ts` to verify `adminUserId` exists in `AdminUser` table prior to foreign key assignment, recording the actor email in metadata if unmapped.
- **Verification**: `tests/integration/security-rbac.test.ts`
