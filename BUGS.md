# Defect & Bug Tracking Ledger: Pharmico Admin Center

| Bug ID | Severity | Module / Area | Description | Root Cause File & Line | Status | Regression Test |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **BUG-01** | **P0** | Auth / Security | Frontend authentication bypassed with mock `defaultAdmin` user, hardcoded `bypass-token`, and auto-redirecting `LoginPage` | `apps/admin-web/src/app/(auth)/login/page.tsx:9` & `apps/admin-web/src/store/authStore.ts:39` | **FIXED** (commit `821de11`) | `tests/e2e/admin-flow.spec.ts` |
| **BUG-02** | **P2** | Add Product / Wizard | Card heading in Add Product form mismatched specification ("Medicine Media" vs "Product Media") causing test failure | `apps/admin-web/src/app/(dashboard)/products/add/page.tsx:1049` | **FIXED** (commit `821de11`) | `tests/e2e/admin-flow.spec.ts` |
| **BUG-03** | **P2** | Tooling / Linting | Broken ESLint configuration across `admin-api` and `admin-web` preventing CI checks | `apps/admin-api/.eslintrc.json` & `apps/admin-web/.eslintrc.json` | **FIXED** (commit `821de11`) | `npm run lint` |
| **BUG-04** | **P1** | Inventory Core | Missing Feature: Standalone Add/Edit/Delete Batch endpoints & UI on existing product variants | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **OPEN** | S2 Scenario Suite |
| **BUG-05** | **P1** | Inventory Core | Missing Feature: Supplier Purchase Entry workflow (`admin_purchase_entries`, invoice deduplication, stock increase) | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **OPEN** | S4 Scenario Suite |
| **BUG-06** | **P1** | Inventory Core | Missing Feature: Expiry write-off ledger action & IST boundary 30/60/90 days alerts | `apps/admin-api/src/modules/inventory/inventory.service.ts` | **OPEN** | S6 Scenario Suite |
| **BUG-07** | **P1** | Inventory Core | Missing Feature: CSV batch import/export with formula injection defense and duplicate SKU handling | `apps/admin-api/src/modules/inventory/inventory.routes.ts` | **OPEN** | S10 Scenario Suite |
| **BUG-08** | **P2** | Inventory Core | Missing Feature: Stock Valuation (purchase vs selling) and Dead Stock breakdown reports | `apps/admin-api/src/modules/reports/reports.service.ts` | **OPEN** | S11 Scenario Suite |

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
