# Requirements Traceability Matrix (RTM): Pharmico Admin Control Center

| ID | Module | Scenario / Feature | Test Type | Permission Required | Status | Bug IDs |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TM-AUTH-01** | Auth | Staff login with valid credentials (email & password) | E2E / API | Public | ✅ Pass | BUG-01 (fixed) |
| **TM-AUTH-02** | Auth | Brute force lockout after 5 consecutive failed attempts | Security / API | Public | ⚠️ Needs Test | — |
| **TM-AUTH-03** | Auth | Two-Factor Authentication (TOTP 2FA) challenge & verification | E2E / API | Public / Staff | ✅ Pass | — |
| **TM-AUTH-04** | Auth | JWT session rotation & refresh token reuse detection | API | Public | ⚠️ Needs Test | — |
| **TM-AUTH-05** | Auth | Terminate session & revoke active device tokens | API / UI | Staff | ⚠️ Needs Test | — |
| **TM-DASH-01** | Dashboard | Summary KPI cards (Revenue, Orders, Expiring, Low Stock) match DB | Integration / UI | `orders:read` | ✅ Pass | — |
| **TM-DASH-02** | Dashboard | SSE real-time event updates without full page refresh | Integration | `orders:read` | ⚠️ Needs Test | — |
| **TM-CAT-01** | Products | 5-step Add Medicine Wizard (Overview, Clinical, Pricing, Batches, Review) | E2E / UI | `products:create` | ✅ Pass | BUG-02 (fixed) |
| **TM-CAT-02** | Products | Duplicate SKU and barcode rejection with validation errors | API / Integration | `products:create` | ⚠️ Needs Test | — |
| **TM-CAT-03** | Products | Price rules enforcement (Selling Price <= MRP, GST math, discount %) | Unit / API | `products:create` | ✅ Pass | — |
| **TM-CAT-04** | Products | 1000-character description counter & autosave draft | UI / Integration | `products:create` | ⚠️ Needs Test | — |
| **TM-CAT-05** | Products | Image upload validation (type, size limits, reorder, primary) | UI / API | `products:create` | ⚠️ Needs Test | — |
| **TM-CAT-06** | Products | Soft delete product and restore flow | API / UI | `products:delete` | ⚠️ Needs Test | — |
| **TM-INV-01** | Inventory | View FEFO sorted batches with days-until-expiry calculations | UI / API | `inventory:read` | ✅ Pass | — |
| **TM-INV-02** | Inventory | Invariant I1: Batch quantity never drops below zero | Invariant / DB | `inventory:update` | ⚠️ Needs Test | — |
| **TM-INV-03** | Inventory | Invariant I2: Opening Qty + Sum(Stock Movements) = Current Qty | Invariant / DB | `inventory:update` | ⚠️ Needs Test | — |
| **TM-INV-04** | Inventory | Invariant I3: Total stock equals sum of unexpired batches | Invariant / DB | `inventory:read` | ⚠️ Needs Test | — |
| **TM-INV-05** | Inventory | Invariant I4: Expired stock is never allocated/sold | Invariant / DB | `inventory:update` | ⚠️ Needs Test | — |
| **TM-INV-06** | Inventory | Invariant I5: Every stock mutation generates an audit ledger entry | Invariant / DB | `inventory:update` | ✅ Pass | — |
| **TM-INV-07** | Inventory | Invariant I6: Cancelled / timed-out orders restore stock to same batch | Invariant / DB | `orders:update` | ⚠️ Needs Test | — |
| **TM-INV-08** | Inventory | Batch creation with mfg date, expiry date, purchase price | API / UI | `inventory:create` | ⚠️ Needs Endpoint | BUG-04 |
| **TM-INV-09** | Inventory | FEFO multi-batch consumption: order spanning 2 batches splits correctly | Unit / API | `orders:create` | ✅ Pass | — |
| **TM-INV-10** | Inventory | Supplier Purchase Entry (Supplier + Invoice No. increases batch stock) | API / UI | `inventory:create` | ⚠️ Needs Feature | BUG-05 |
| **TM-INV-11** | Inventory | Stock Adjustment: Damage, Correction, Return with mandatory reason | API / UI | `inventory:update` | ✅ Pass | — |
| **TM-INV-12** | Inventory | Batch Quarantine & Block from dispensing | API / UI | `inventory:update` | ✅ Pass | — |
| **TM-INV-13** | Inventory | Expiry alerts (30/60/90 days IST) & write-off flow | Job / API | `inventory:update` | ⚠️ Needs Feature | BUG-06 |
| **TM-INV-14** | Inventory | Low-stock threshold alerts and storefront out-of-stock badge sync | Integration | `inventory:read` | ⚠️ Needs Test | — |
| **TM-INV-15** | Inventory | Concurrency: Parallel checkouts preventing overselling | Concurrency | `orders:create` | ⚠️ Needs Test | — |
| **TM-INV-16** | Inventory | CSV Import & Export with formula injection sanitization | API / UI | `inventory:export` | ⚠️ Needs Feature | BUG-07 |
| **TM-INV-17** | Inventory | Valuation reports (Purchase vs Selling valuation, Dead Stock) | API / UI | `reports:read` | ⚠️ Needs Feature | BUG-08 |
| **TM-ORD-01** | Orders | Order status transitions adhere to statutory state machine | Unit / API | `orders:update` | ✅ Pass | — |
| **TM-ORD-02** | Orders | Prescription gate: Rx orders cannot be CONFIRMED without approved Rx | Integration / API | `orders:update` | ⚠️ Needs Test | — |
| **TM-ORD-03** | Orders | Razorpay refund processing (full and partial) is idempotent | Integration / API | `orders:update` | ✅ Pass | — |
| **TM-RX-01** | Prescriptions | Prescription queue inspection, image zooming & patient notes | UI / API | `prescriptions:read` | ✅ Pass | — |
| **TM-RX-02** | Prescriptions | Pharmacist prescription approval with statutory validity date | API / UI | `prescriptions:update` | ⚠️ Needs Test | — |
| **TM-RX-03** | Prescriptions | Prescription rejection with mandatory statutory reason & email notice | API / UI | `prescriptions:update` | ⚠️ Needs Test | — |
| **TM-RBAC-01** | Security | 6 Roles x All Modules permission matrix enforcement | RBAC / Security | System | ⚠️ Needs Test | — |
| **TM-RBAC-02** | Security | Customer JWTs cannot access Admin endpoints (403 Forbidden) | Security | Public | ✅ Pass | — |
| **TM-SYNC-01** | Sync | Catalog mutation triggers instant ISR revalidation to Main Store | Integration / Webhook | System | ⚠️ Needs Test | — |
| **TM-SYNC-02** | Sync | Redis pub/sub gracefully handles network failure / standalone mode | Integration | System | ✅ Pass | — |
| **TM-A11Y-01** | A11y | Zero critical/serious WCAG accessibility violations across all pages | Automated / Axe | Public | ⚠️ Needs Test | — |
| **TM-PERF-01** | Perf | Dashboard and catalog pagination loads under 2000ms | Perf / Autocannon | Staff | ⚠️ Needs Test | — |
