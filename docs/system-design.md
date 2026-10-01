# System Design: Pharmico Admin Control Center

## 1. Problem Statement
Online retail pharmacies and medical e-commerce platforms must operate under strict regulatory standards (such as CDSCO, Drugs and Cosmetics Rules 1945, Schedule H & H1 drug mandates). Unlike typical consumer e-commerce, a pharmacy admin platform requires:
- Mandatory digital prescription verification by licensed registered pharmacists prior to dispensing.
- Strict First-Expiry-First-Out (FEFO) batch tracking to prevent expired medications from reaching consumers.
- Complete audit trails of every batch adjustment, price change, and prescription decision.
- Real-time stock reservation, doctor teleconsultation assignment, and cold-chain/fragile order routing.

The **Pharmico Admin Control Center** solves this by providing a high-performance, decoupled management center for pharmacists, inventory managers, customer support reps, and executive store administrators.

---

## 2. User Roles & Personas

| Role | Responsibilities | Core Workflows |
|---|---|---|
| **SUPER_ADMIN** | Overall system ownership, staff management, store settings, financial reconciliation. | Full CRUD across all modules, granting permissions, managing store configs. |
| **ADMIN** | Daily operations lead, catalog, promotional campaigns, inventory management. | Approving bulk stock adjustments, issuing coupons, staff onboarding. |
| **PHARMACIST** | Licensed medical professional validating prescriptions. | Rx Document Inspector (zoom/rotate/contrast), Schedule H1 checks, approving/rejecting Rx. |
| **INVENTORY_MANAGER** | Warehouse stock intake, batch quarantine, expiration monitoring. | Inwarding batches, FEFO adjustments, batch recalls/quarantine, stock ledger audit. |
| **SUPPORT** | Customer issue resolution, returns, consultation scheduling. | Viewing orders, customer details, adding internal order notes, viewing chat logs. |
| **MARKETING** | Sales and merchandising. | Managing promotional banners, discount coupons, analyzing product reviews. |

---

## 3. Core User Workflows

### Workflow 1: Prescription Verification & Dispensing
1. Customer uploads handwritten prescription on main storefront.
2. Ingested via Redis pub/sub (`store:orders`) into `admin_events` queue.
3. Registered Pharmacist reviews high-resolution Rx image via zoom, rotate, and contrast tools.
4. Pharmacist verifies doctor registration number, patient details, and selects matching catalog items.
5. If Schedule H1 drug is present, the action is automatically logged in the Chemist Compliance Register.
6. Approval triggers customer notification and transitions order to `PROCESSING`.

### Workflow 2: FEFO Batch Inventory Management
1. Inward batches recorded with manufacture date, expiry date, purchase cost, and quantity.
2. When orders are placed, stock is automatically allocated from the earliest expiring batch (`FEFO`).
3. Damaged or recalled batches are quarantined with one click (`isBlocked: true`), immediately removing them from sellable storefront inventory.
4. Every manual adjustment records a non-destructively audited movement in the Stock Movement Ledger.

### Workflow 3: Order Lifecycle & State Machine Transitions
1. Orders follow strict state transitions: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED` (or `CANCELLED` / `REFUNDED`).
2. Invalid transitions are blocked by the backend state machine.
3. Status changes publish cache-invalidation events to the storefront.

---

## 4. Non-Functional Requirements (NFRs)

- **Performance**:
  - p95 API response time < 150ms for catalog and inventory queries.
  - Sub-second UI updates on state machine changes.
- **Availability**: 99.9% uptime target during business operating hours.
- **Data Isolation & Integrity**: Strict ACID compliance for inventory reservations using PostgreSQL row-level locks and transactions.
- **Compliance & Security**:
  - Immutable audit logs for all administrative actions (`admin_audit_logs`).
  - Passwords hashed with bcrypt (salt rounds 12).
  - Optional 2FA with TOTP (Google Authenticator / Authy).
- **Out of Scope for Admin System**:
  - Customer-facing payment processing (handled by main storefront).
  - Direct shipping carrier delivery driver tracking apps.
  - End-user medical consultations video streaming (handled via WebRTC link dispatch).

---

## 5. Capacity & Load Estimation (Year 1)

- **Daily Active Admins / Pharmacists**: 50 concurrent staff members.
- **Peak API Requests per Second (RPS)**: 50–100 RPS.
- **Orders Processed per Day**: 5,000–10,000 orders.
- **Prescription Images Uploaded**: ~3,000 images/day (~6 GB storage/month, S3 / Cloudflare R2).
- **Primary Bottleneck to Watch**: Database connection pool exhaustion during concurrent batch stock deductions and audit logging (mitigated via Prisma connection pooling and Redis caching).
