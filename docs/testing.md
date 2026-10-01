# Automated Testing Strategy: Pharmico Admin Control Center

## 1. Testing Philosophy & Boundaries
To guarantee regulatory compliance and financial precision, our test suite enforces a strict testing pyramid:

```
           /\
          /  \         E2E Tests (Playwright)
         / 10 \        Critical user journeys (Login, Rx, Batch inward, Order state)
        /------\
       /        \      Integration Tests (Vitest + Test DB)
      /    30    \     API endpoints, RBAC checks, Zod validation, Prisma queries
     /------------\
    /              \   Unit Tests (Vitest)
   /       60       \  Pure domain logic: FEFO algorithm, pricing calculations, state machine
  /------------------\
```

---

## 2. Mocking Guidelines: What to Mock vs. Never Mock

| Component | Policy | Rationale |
|---|---|---|
| **External Payment Gateway (Razorpay)** | **MOCK** | Prevent real monetary debits or reliance on testnet sandbox availability. |
| **External SMTP / Mail Gateway** | **MOCK** | Prevent spamming real email domains during automated test runs. |
| **AWS S3 / Cloudflare R2** | **MOCK / MinIO** | Mock pre-signed URL generation; use MinIO container for integration if needed. |
| **Internal PostgreSQL Database** | **NEVER MOCK** | Mocking Prisma hides foreign key violations, locking bugs, and constraint errors. Tests must run against a real or ephemeral test database. |
| **Authentication & RBAC (`can()`)** | **NEVER MOCK** | Testing against mocked auth allows unauthorized endpoint exposure to go undetected. |

---

## 3. The 4 Critical End-to-End (E2E) Test Journeys

All critical journeys are automated in `tests/e2e/`:

1. **Staff Authentication Journey**:
   - Valid credentials login -> JWT cookie issued -> redirect to dashboard.
   - Invalid password -> rate limit throttle trigger after 5 attempts.
   - 2FA TOTP prompt -> code verification -> session activated.

2. **Prescription Verification & Dispensing Journey**:
   - Pharmacist logs in -> views prescription review queue.
   - Opens Rx modal -> zooms & rotates document -> selects verified catalog items.
   - Checks Schedule H1 compliance checkbox -> clicks Approve -> order status updates to `PROCESSING`.

3. **FEFO Batch Intake & Inventory Allocation**:
   - Inventory Manager creates new batch (Lot, Mfg Date, Expiry Date, Qty 100).
   - Simulates order creation -> verifies stock allocated from earliest expiring batch.
   - Quarantines damaged batch (`isBlocked: true`) -> verifies storefront stock deduction.

4. **Order State Machine Transitions**:
   - Tests valid sequence: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
   - Tests illegal transition: `DELIVERED` -> `PENDING` fails with HTTP 422.

---

## 4. Test Execution Commands

```bash
# Run fast unit tests in watch mode
npm run test:unit

# Run full integration and unit suite with coverage
npm test

# Run Playwright E2E browser tests (headless)
npx playwright test

# Run Playwright UI inspector mode
npx playwright test --ui
```
