# Demo Seed Reference & Test Dataset: Pharmico Admin Center

This document outlines the standard demonstration seed dataset populated in the shared database for client acceptance testing, staff onboarding, and verification.

---

## 1. How to Populate or Reset the Seed Dataset

Run the following command from the root of the repository:
```bash
npm run db:seed
```
This script executes `packages/db/prisma/seed.ts` idempotently using `upsert`, guaranteeing that all baseline roles, staff accounts, categories, brands, suppliers, products, and initial FEFO inventory batches are populated.

---

## 2. Seeded Administrative User Accounts

All seed administrative accounts are configured with the baseline statutory password:
**Default Password**: `Admin@123456`

| Name | Email | Role | Key Permissions | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **System Super Admin** | `admin@pharmacy.com` | `SUPER_ADMIN` | `*` (Full Wildcard Access) | Primary administrator account for demo and audits |
| **Clinical Pharmacist** | `pharmacist@pharmacy.com` | `PHARMACIST` | `orders:read`, `inventory:read` | Order verification and inventory inspection |
| **Inventory Controller** | `inventory@pharmacy.com` | `INVENTORY_MANAGER` | `inventory:read`, `inventory:write`, `inventory:adjust` | Stock inwarding, batch management, supplier invoicing |
| **Fulfillment Clerk** | `clerk@pharmacy.com` | `ORDER_CLERK` | `orders:read`, `orders:update`, `inventory:read` | Order packing, status advancement, dispatch slips |
| **Support Executive** | `support@pharmacy.com` | `SUPPORT` | `orders:read`, `customers:read` | Customer inquiries and order tracking |
| **Growth & Marketing** | `marketing@pharmacy.com` | `MARKETING` | `coupons:*`, `banners:*`, `reviews:*` | Promotional campaigns and discount management |

---

## 3. Seeded Suppliers (Distributor Master Data)

5 licensed pharmaceutical distributors are registered with valid GSTINs and contact addresses:

1. **Apollo Wholesale Pharmaceuticals** — GSTIN: `27AAACA1234A1Z5` (Mumbai, Maharashtra)
2. **MedPlus Central Distribution Hub** — GSTIN: `36AAACM5678B1Z2` (Hyderabad, Telangana)
3. **Sun Pharma Primary Stockist** — GSTIN: `24AAACS9012C1Z9` (Ahmedabad, Gujarat)
4. **Cipla Distribution Logistics** — GSTIN: `27AAACC3456D1Z6` (Kurla, Mumbai)
5. **Reddy Labs Direct Inwarding** — GSTIN: `36AAACR7890E1Z3` (Banjara Hills, Hyderabad)

---

## 4. Seeded Catalog & Therapeutic Categories

17 therapeutic categories are configured:
- **Antibiotics & Anti-Infectives**
- **Analgesics & Pain Relief**
- **Cardiovascular & Blood Pressure**
- **Diabetes Management**
- **Respiratory & Asthma**
- **Gastrointestinal & Digestive Health**
- **Dermatology & Skin Care**
- **Vitamins, Minerals & Supplements**
- **Pediatric Formulations**
- **Women's Health & Wellness**
- **Eye & Ear Drops**
- **Surgicals & First Aid**
- **Ayurvedic & Herbal Preparations**
- **Critical Care & Injectables**
- **Neurology & Psychiatric Medications**
- **Orthopedic Supports**
- **Diagnostic Devices & Monitors**

---

## 5. Seeded Products & FEFO Batch Inventory

The database contains **68 distinct pharmaceutical products** with realistic dosages, HSN codes (3004), Schedule classifications, and manufacturer batch records.

### Representative FEFO Batch Test Items:
- **Paracetamol 650mg Tablets** (SKU: `MED-PCM-650`)
  - Batch `PCM-2026-A1` (Expires in 60 days, Qty: 150)
  - Batch `PCM-2026-B2` (Expires in 180 days, Qty: 400)
  - Batch `PCM-2027-C3` (Expires in 365 days, Qty: 800)
- **Amoxicillin 500mg Capsules** (SKU: `MED-AMX-500`)
  - Batch `AMX-2026-01` (Expires in 90 days, Qty: 200)
  - Batch `AMX-2026-02` (Expires in 270 days, Qty: 500)
- **Metformin 500mg SR Tablets** (SKU: `MED-MET-500`)
  - Batch `MET-2026-M1` (Expires in 120 days, Qty: 300)
- **Atorvastatin 10mg Tablets** (SKU: `MED-ATV-10`)
  - Batch `ATV-2026-S1` (Expires in 150 days, Qty: 250)

All batch quantities are reconciled with opening records in the `admin_stock_movements` ledger table, satisfying Invariant I2.
