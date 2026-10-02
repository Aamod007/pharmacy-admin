# Client User Acceptance Testing (UAT) Guide: Pharmico Admin Control Center

This runbook contains 30 non-technical, step-by-step verification scenarios for pharmacy directors, store managers, inventory controllers, and compliance auditors. Each scenario describes the prerequisite role, exact UI actions, expected system behavior, and compliance validation criteria.

---

## Section 1: Authentication, Access Governance & Security

### Scenario 1: Staff Secure Login
- **Persona / Role**: Any authorized staff member (e.g., `admin@pharmacy.com`)
- **Objective**: Verify standard credential-based authentication with encrypted session cookie creation.
- **Steps**:
  1. Open browser to `http://localhost:3002/login`.
  2. Enter valid staff email (`admin@pharmacy.com`) and password (`Admin@123456`).
  3. Click **Sign In to Control Center**.
- **Expected Result**: System validates credentials, establishes secure JWT session, and redirects user to `/dashboard`.
- **Compliance Check**: Password field obscures characters; credentials are transmitted securely.

### Scenario 2: Two-Factor Authentication (TOTP 2FA) Enforcement
- **Persona / Role**: Super Admin (`admin@pharmacy.com`)
- **Objective**: Verify TOTP 2FA setup and step-up challenge during login.
- **Steps**:
  1. Navigate to **Store Settings** > **Security & 2FA**.
  2. Click **Enable 2FA** to generate QR code and secret key.
  3. Scan QR code in Google Authenticator or 1Password.
  4. Enter the 6-digit TOTP token to confirm pairing.
- **Expected Result**: 2FA status toggles to Active; subsequent logins prompt for the dynamic 6-digit code.

### Scenario 3: Brute Force Password Lockout
- **Persona / Role**: Unauthenticated visitor
- **Objective**: Confirm protection against credential stuffing.
- **Steps**:
  1. On `/login`, enter `admin@pharmacy.com` with an incorrect password 5 consecutive times.
- **Expected Result**: System returns HTTP 429 / Rate Limited and temporarily blocks subsequent attempts for 15 minutes.

### Scenario 4: Role-Based Access Control (RBAC) Least Privilege
- **Persona / Role**: Support Staff (`support@pharmacy.com`)
- **Objective**: Ensure staff members cannot access administrative functions outside their authorization.
- **Steps**:
  1. Log in as Support Staff.
  2. Attempt to open `/settings` or `/staff`.
- **Expected Result**: Navigation links are hidden or page displays "Access Denied / 403 Forbidden".

### Scenario 5: Audit Log Immutability
- **Persona / Role**: Compliance Auditor (`admin@pharmacy.com`)
- **Objective**: Confirm that all administrative actions generate tamper-proof audit records.
- **Steps**:
  1. Navigate to **Audit Trail** (`/audit`).
  2. Search for recent actions (e.g., login, inventory adjustment, settings update).
- **Expected Result**: Every record displays timestamp, staff actor email, IP address, action type, and JSON change payload. Audit logs cannot be deleted or edited via the UI.

---

## Section 2: Medicine Catalog & Master Data Management

### Scenario 6: Browse Medicine Catalog
- **Persona / Role**: Catalog Manager (`admin@pharmacy.com`)
- **Objective**: Verify catalog browsing, searching, and status badges.
- **Steps**:
  1. Navigate to **Medicines & Store** > **Medicine Catalog** (`/products`).
  2. Search for "Paracetamol" or "Amoxicillin".
- **Expected Result**: Matching medicines appear instantly with SKU, brand, category, MRP, selling price, and active stock count.

### Scenario 7: Add New Medicine via Wizard
- **Persona / Role**: Catalog Manager
- **Objective**: Complete the 5-step Medicine Creation Wizard.
- **Steps**:
  1. Click **Add Medicine +** (`/products/add`).
  2. **Step 1 (Overview)**: Enter Name ("Azithromycin 500mg"), Generic Name, SKU, and Category.
  3. **Step 2 (Details)**: Enter Description, Dosage Form ("Tablet"), and Manufacturer.
  4. **Step 3 (Pricing & Tax)**: Enter MRP (₹120), Selling Price (₹95), and HSN Code (3004) with GST 12%.
  5. **Step 4 (Initial Batch)**: Enter Batch Number ("AZI-2026-01"), Mfg Date, Expiry Date, and Opening Qty (100).
  6. **Step 5 (Review)**: Verify all entered details and click **Publish Product**.
- **Expected Result**: Product is saved to database, opening stock movement is recorded, and product appears in catalog.

### Scenario 8: Pricing Invariant Enforcement (Selling Price <= MRP)
- **Persona / Role**: Catalog Manager
- **Objective**: Prevent accidental price gouging or invalid pricing entries.
- **Steps**:
  1. On the Add/Edit Product page, enter MRP: ₹100 and Selling Price: ₹150.
  2. Click save.
- **Expected Result**: Form validation blocks submission with error: "Selling price cannot exceed Maximum Retail Price (MRP)".

### Scenario 9: Category & Therapeutic Classification
- **Persona / Role**: Catalog Manager
- **Objective**: Create and organize medicine categories.
- **Steps**:
  1. Navigate to **Medicines & Store** > **Categories** (`/categories`).
  2. Click **Add Category**, enter Name ("Cardiovascular Care"), Slug, and Description.
  3. Save category.
- **Expected Result**: Category is listed with active count 0 and becomes selectable in the medicine creation wizard.

### Scenario 10: Manufacturer Brand Management
- **Persona / Role**: Catalog Manager
- **Objective**: Register pharmaceutical manufacturers and brands.
- **Steps**:
  1. Navigate to **Medicines & Store** > **Brands** (`/brands`).
  2. Add new brand "Sun Pharma", enter country of origin ("India"), and save.
- **Expected Result**: Brand is created and immediately available for association with catalog items.

---

## Section 3: Statutory FEFO Inventory & Batch Lifecycle

### Scenario 11: Inspect FEFO Sorted Batch Inventory
- **Persona / Role**: Inventory Manager (`inventory@pharmacy.com`)
- **Objective**: Verify that batches are sorted chronologically by expiry date (First-Expiry-First-Out).
- **Steps**:
  1. Navigate to **FEFO Inventory** (`/inventory`).
  2. Observe the Batches table.
- **Expected Result**: Batches with earliest expiry dates appear at the top with color-coded "Days Remaining" chips.

### Scenario 12: Add New Batch to Existing Medicine
- **Persona / Role**: Inventory Manager
- **Objective**: Record new manufacturing lot for an existing medicine.
- **Steps**:
  1. On `/inventory`, click **Add Batch**.
  2. Select medicine "Paracetamol 650mg", enter Batch Number ("PCM-884"), Mfg Date (last month), Expiry Date (2 years future), and Quantity (500).
  3. Enter Purchase Price (₹1.20/unit) and MRP (₹2.50/unit).
  4. Submit form.
- **Expected Result**: Batch is created with status ACTIVE; inventory stock increases by 500 units; INWARD stock movement is logged.

### Scenario 13: Expiry Date Validation (Expiry Must Be After Mfg Date)
- **Persona / Role**: Inventory Manager
- **Objective**: Prevent erroneous or inverted batch dates.
- **Steps**:
  1. Attempt to add a batch with Mfg Date: `2026-10-01` and Expiry Date: `2026-05-01`.
- **Expected Result**: System blocks intake with error: "Expiry date must be after manufacturing date".

### Scenario 14: Already Expired Batch Rejection
- **Persona / Role**: Inventory Manager
- **Objective**: Enforce statutory prohibition against inwarding expired stock.
- **Steps**:
  1. Attempt to add a batch with Expiry Date in the past (e.g., `2025-01-01`).
- **Expected Result**: System rejects the batch with error: "Cannot intake already expired batch into active inventory".

### Scenario 15: Duplicate Batch Number Rejection
- **Persona / Role**: Inventory Manager
- **Objective**: Prevent duplicate batch collision on the same product variant.
- **Steps**:
  1. Add a batch with an existing batch number for the same medicine variant.
- **Expected Result**: System rejects creation with error: "A batch with this number already exists for this product variant".

### Scenario 16: Statutory Stock Adjustment (Damage / Breakage)
- **Persona / Role**: Inventory Manager
- **Objective**: Record stock write-off due to transit damage or broken seals.
- **Steps**:
  1. On `/inventory`, find batch "PCM-884".
  2. Click **Adjust Stock**.
  3. Select Type: "DAMAGE / BREAKAGE", Quantity: `-10`, and enter Reason: "Liquid leak during shelf stocking".
  4. Confirm adjustment.
- **Expected Result**: Batch quantity drops by 10; ledger movement recorded with reason; Invariant I2 holds.

### Scenario 17: Non-Negative Stock Invariant (I1) Guard
- **Persona / Role**: Inventory Manager
- **Objective**: Confirm that stock cannot be adjusted into negative numbers.
- **Steps**:
  1. On a batch with 15 units, attempt to make a downward adjustment of `-25` units.
- **Expected Result**: Transaction is blocked with error: "Insufficient stock: Adjustment would cause negative inventory".

### Scenario 18: Batch Expiry Quarantine & Write-off
- **Persona / Role**: Compliance Officer (`admin@pharmacy.com`)
- **Objective**: Quarantine near-expiry or expired medicine lots so they cannot be dispensed.
- **Steps**:
  1. On `/inventory`, select batch approaching expiry.
  2. Click **Quarantine / Block Batch**.
  3. Enter reason: "Batch quarantined per regulatory notice".
- **Expected Result**: `isBlocked` is set to `true`; batch is excluded from storefront order allocation engine.

### Scenario 19: Supplier Purchase Entry & Invoicing
- **Persona / Role**: Inventory Manager
- **Objective**: Inward a commercial purchase shipment from an authorized pharmaceutical distributor.
- **Steps**:
  1. Navigate to `/inventory` > **Supplier Purchases**.
  2. Select Supplier ("Apollo Wholesale Distributors"), enter Invoice Number ("INV-2026-9041"), and Invoice Date.
  3. Add Line Item: "Amoxicillin 500mg", Batch: "AMX-99", Qty: 200, Purchase Rate: ₹45.00, GST: 12%.
  4. Submit Purchase Entry.
- **Expected Result**: Purchase entry recorded in `admin_purchase_entries`; batch quantity increments by 200; total GST and net invoice value calculated accurately.

### Scenario 20: Supplier Invoice Deduplication
- **Persona / Role**: Inventory Manager
- **Objective**: Prevent duplicate billing from the same supplier.
- **Steps**:
  1. Re-submit a purchase entry with the same Supplier and Invoice Number ("INV-2026-9041").
- **Expected Result**: System blocks submission with error: "Supplier invoice number already exists for this supplier".

---

## Section 4: Order Fulfillment, FEFO Allocation & Restocking

### Scenario 21: View Order Queue & Fulfillment Status
- **Persona / Role**: Order Fulfillment Clerk (`clerk@pharmacy.com`)
- **Objective**: Inspect orders in the pipeline.
- **Steps**:
  1. Navigate to **Orders & Sales** (`/orders`).
  2. Filter by status: `PLACED`, `CONFIRMED`, `SHIPPED`, or `DELIVERED`.
- **Expected Result**: Orders table displays Order Number, customer contact, item count, payment method, and total amount.

### Scenario 22: Automatic FEFO Batch Allocation on Order Confirmation
- **Persona / Role**: Order Fulfillment Clerk
- **Objective**: Verify that confirming an order automatically deducts stock from the earliest expiring batch.
- **Steps**:
  1. Open a `PLACED` order containing 2 units of "Paracetamol 650mg".
  2. Change status to `CONFIRMED`.
  3. Check the Inventory Ledger for the medicine.
- **Expected Result**: The system automatically allocates 2 units from the earliest expiring batch, writes a `SALE` movement to the stock ledger, and updates batch balance.

### Scenario 23: Multi-Batch Order Splitting
- **Persona / Role**: Order Fulfillment Clerk
- **Objective**: Verify that an order exceeding the oldest batch's quantity splits across chronological batches.
- **Steps**:
  1. Assume Batch A has 3 units (expires in 2 months) and Batch B has 10 units (expires in 6 months).
  2. Confirm an order requesting 5 units.
- **Expected Result**: 3 units are allocated from Batch A (reducing it to 0), and remaining 2 units are allocated from Batch B (reducing it to 8).

### Scenario 24: Order Cancellation & Automatic Stock Restock
- **Persona / Role**: Order Fulfillment Clerk
- **Objective**: Confirm that cancelling an order safely returns allocated inventory.
- **Steps**:
  1. Take a `CONFIRMED` order that was previously allocated stock.
  2. Update status to `CANCELLED` with note: "Customer requested cancellation".
  3. Inspect the batch inventory and ledger.
- **Expected Result**: Stock is restored to the exact same batch; a `RESTOCK` movement is logged with the order number in the reference field.

### Scenario 25: Print Packing Slip & Dispatch Manifest
- **Persona / Role**: Dispatch Staff (`clerk@pharmacy.com`)
- **Objective**: Generate statutory packing slip with allocated batch numbers and expiry dates.
- **Steps**:
  1. On the order detail page, click **Print Packing Slip**.
- **Expected Result**: A clean, printable document opens displaying order ID, customer address, allocated batch numbers, expiry dates, and pharmacist signature block.

---

## Section 5: Storefront Synchronization, Reports & Settings

### Scenario 26: Inventory CSV Export with Formula Injection Sanitization
- **Persona / Role**: Store Manager (`admin@pharmacy.com`)
- **Objective**: Safely export stock valuation report to CSV.
- **Steps**:
  1. Navigate to `/inventory` and click **Export CSV**.
  2. Open the downloaded file in Microsoft Excel or LibreOffice Calc.
- **Expected Result**: All active batches, quantities, purchase values, and expiry dates are listed. Any fields starting with `=`, `+`, `-`, or `@` are safely prefixed with `'` to neutralize formula injection attacks.

### Scenario 27: Stock Valuation & Margin Analytics
- **Persona / Role**: Finance Manager (`admin@pharmacy.com`)
- **Objective**: Review aggregate inventory capital and projected margins.
- **Steps**:
  1. Navigate to `/reports`.
  2. Review the Stock Valuation card.
- **Expected Result**: Displays Total Purchase Valuation (Cost of Goods on Hand), Total Retail Selling Value, and Projected Gross Margin.

### Scenario 28: Instant Storefront Revalidation Trigger
- **Persona / Role**: Store Manager
- **Objective**: Push manual cache revalidation to the customer-facing Medico storefront.
- **Steps**:
  1. Navigate to **Store Settings** (`/settings`).
  2. Click **Revalidate Storefront Cache Now**.
- **Expected Result**: System triggers ISR revalidation across `/`, `/products`, and category paths; success toast displays confirmation.

### Scenario 29: Failed Revalidation Retry Queue
- **Persona / Role**: Store Manager
- **Objective**: Verify that temporary storefront outages do not drop cache invalidation tasks.
- **Steps**:
  1. Under `/settings`, view **Sync Resilience Status**.
  2. Click **Retry Failed Syncs**.
- **Expected Result**: Queued retry events are processed; sync audit log updates with success count.

### Scenario 30: Staff Management & Directory Audit
- **Persona / Role**: Administrator (`admin@pharmacy.com`)
- **Objective**: Invite new pharmacy staff member and inspect staff directory.
- **Steps**:
  1. Navigate to **Staff Directory** (`/staff`).
  2. Click **Invite Staff Member**.
  3. Enter Name ("Priya Sharma"), Email ("priya@pharmico.health"), and submit.
- **Expected Result**: Staff member is created; welcome email/token is generated; user appears in the active staff directory with Administrator operational access.
