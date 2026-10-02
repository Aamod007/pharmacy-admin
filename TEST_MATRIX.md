# Requirements Traceability Matrix (RTM): Pharmico Admin Control Center

## Scope & Architectural Alignment
Following client directive, the standalone Admin Control Center is focused exclusively on **Retail Pharmacy Operations**: Inventory Management, FEFO Dispatch, Statutory Batch Auditing, Order Fulfillment, Customer Management, Staff & RBAC Governance, and Storefront Revalidation Synchronization. All decoupled services without active operational requirements (Prescription Review, Doctor Teleconsultations, Background Job Queues, Image Upload Services, and Email Template Editing) have been completely removed from the platform.

---

## Traceability & Test Results Matrix

| ID | Module | Scenario / Feature | Test Type | Permission Required | Status | Verifying Test Suite |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TM-AUTH-01** | Auth | Staff login with credentials (email & password) | E2E / API | Public | ✅ Pass | `tests/e2e/admin-flow.spec.ts` |
| **TM-AUTH-02** | Auth | Brute force lockout & rate limiting on login | Security / API | Public | ✅ Pass | `tests/unit/prelaunch-checklist.test.ts` |
| **TM-AUTH-03** | Auth | Two-Factor Authentication (TOTP 2FA) setup & verification | API / Unit | Public / Staff | ✅ Pass | `tests/integration/security-rbac.test.ts` |
| **TM-AUTH-04** | Auth | Production JWT verification with HS256 algorithm enforcement | API / Security | Staff | ✅ Pass | `tests/integration/security-rbac.test.ts` |
| **TM-AUTH-05** | Auth | Token revocation & expired token rejection (401) | API / Security | Public | ✅ Pass | `tests/integration/security-rbac.test.ts` |
| **TM-DASH-01** | Dashboard | Summary KPI cards (Revenue, Orders, Expiring, Low Stock) match DB | Integration / UI | `orders:read` | ✅ Pass | `tests/e2e/admin-flow.spec.ts` |
| **TM-DASH-02** | Dashboard | SSE real-time event updates without full page refresh | Integration | `orders:read` | ✅ Pass | `apps/admin-api/src/app.ts` |
| **TM-CAT-01** | Products | 5-step Add Medicine Wizard (Overview, Details, Pricing, Batches, Review) | E2E / UI | `products:create` | ✅ Pass | `tests/e2e/admin-flow.spec.ts` |
| **TM-CAT-02** | Products | Database catalog synchronization and query consistency | Unit / DB | `products:read` | ✅ Pass | `tests/unit/database-catalog-sync.test.ts` |
| **TM-CAT-03** | Products | Price rules enforcement (Selling Price <= MRP, GST math, discount %) | Unit / API | `products:create` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` |
| **TM-CAT-04** | Products | Category CRUD & validation without Prisma errors | Unit / DB | `categories:write` | ✅ Pass | `tests/unit/database-catalog-sync.test.ts` |
| **TM-CAT-05** | Products | Soft delete product and restore flow | API / UI | `products:delete` | ✅ Pass | `apps/admin-api/src/modules/products` |
| **TM-INV-01** | Inventory | View FEFO sorted batches with days-until-expiry calculations | UI / API | `inventory:read` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S1) |
| **TM-INV-02** | Inventory | Invariant I1: Batch quantity never drops below zero | Invariant / DB | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S5, I1) |
| **TM-INV-03** | Inventory | Invariant I2: Latest ledger movement equals current batch quantity | Invariant / DB | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S2-S9, I2) |
| **TM-INV-04** | Inventory | Invariant I3: Total stock equals sum of unexpired batches | Invariant / DB | `inventory:read` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (I3) |
| **TM-INV-05** | Inventory | Invariant I4: Expired stock is never allocated/sold | Invariant / DB | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S6, I4) |
| **TM-INV-06** | Inventory | Invariant I5: Every stock mutation generates an audit ledger entry | Invariant / DB | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S2-S8, I5) |
| **TM-INV-07** | Inventory | Invariant I6: Cancelled / timed-out orders restore stock to same batch | Invariant / DB | `orders:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S8, I6) |
| **TM-INV-08** | Inventory | Batch creation with mfg date, expiry date, purchase price | API / UI | `inventory:create` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S2) |
| **TM-INV-09** | Inventory | FEFO multi-batch consumption: order spanning 2 batches splits correctly | Unit / API | `orders:create` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S3) |
| **TM-INV-10** | Inventory | Supplier Purchase Entry (Supplier + Invoice No. increases batch stock) | API / UI | `inventory:create` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S4) |
| **TM-INV-11** | Inventory | Stock Adjustment: Damage, Correction, Return with mandatory reason | API / UI | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S5) |
| **TM-INV-12** | Inventory | Batch Quarantine & Block from dispensing | API / UI | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S6) |
| **TM-INV-13** | Inventory | Expiry alerts (30/60/90 days IST) & write-off flow | API / Service | `inventory:update` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S6) |
| **TM-INV-14** | Inventory | Low-stock threshold alerts and storefront out-of-stock badge sync | Integration | `inventory:read` | ✅ Pass | `tests/integration/sync-storefront.test.ts` |
| **TM-INV-15** | Inventory | Concurrency: Parallel checkouts preventing overselling (Pessimistic Locks) | Concurrency | `orders:create` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S9) |
| **TM-INV-16** | Inventory | CSV Import & Export with formula injection sanitization | API / UI | `inventory:export` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S10) |
| **TM-INV-17** | Inventory | Valuation reports (Purchase vs Selling valuation, Dead Stock) | API / UI | `reports:read` | ✅ Pass | `tests/unit/inventory-scenarios.test.ts` (S11) |
| **TM-ORD-01** | Orders | Order status transitions adhere to statutory state machine | Unit / API | `orders:update` | ✅ Pass | `tests/unit/orderStateMachine.test.ts` |
| **TM-ORD-02** | Orders | Order search, pagination, and status filters | UI / E2E | `orders:read` | ✅ Pass | `tests/e2e/orders.spec.ts` |
| **TM-ORD-03** | Orders | Razorpay refund processing (full and partial) is idempotent | Integration / API | `orders:update` | ✅ Pass | `tests/integration/security-rbac.test.ts` |
| **TM-RBAC-01** | Security | 6 Roles x All Modules permission matrix enforcement | RBAC / Security | System | ✅ Pass | `tests/integration/security-rbac.test.ts` |
| **TM-RBAC-02** | Security | Customer JWTs cannot access Admin endpoints (403 Forbidden) | Security | Public | ✅ Pass | `tests/unit/crossTenantIsolation.test.ts` |
| **TM-RBAC-03** | Security | Role-based least privilege enforcement (Staff vs Inventory vs Support) | RBAC / Unit | Staff | ✅ Pass | `tests/unit/rbac.test.ts` |
| **TM-SYNC-01** | Sync | Catalog mutation triggers instant ISR revalidation to Main Store | Integration / Webhook | System | ✅ Pass | `tests/integration/sync-storefront.test.ts` |
| **TM-SYNC-02** | Sync | Redis pub/sub gracefully handles network failure / standalone mode | Integration | System | ✅ Pass | `tests/integration/sync-storefront.test.ts` |
| **TM-SYNC-03** | Sync | Storefront sync retry queue and manual retry-now endpoints | API / Integration | `settings:update` | ✅ Pass | `tests/integration/sync-storefront.test.ts` |
| **TM-AUDIT-01** | Audit | Non-destructive audit trail logged for all administrative mutations | API / Security | `audit:read` | ✅ Pass | `tests/integration/security-rbac.test.ts` |
