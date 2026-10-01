# Deployment & Medico Inventory Synchronization Guide

This guide details how to deploy **Pharmico Admin** on **Vercel** (Frontend) and container cloud (Backend API), and how to connect it directly to control the **Medico Storefront Inventory**.

---

## 1. High-Level Architecture

```mermaid
graph TD
    subgraph Storefront ["Customer Experience (Medico)"]
        MedicoWeb["Medico Next.js Storefront (medico.com)"]
        MedicoAPI["Medico API Service"]
    end

    subgraph AdminTier ["Admin Control Center (Pharmico Admin)"]
        AdminWeb["Pharmico Admin UI (Vercel)\nadmin.medico.com"]
        AdminAPI["Pharmico Admin API (Railway / Render / VPS)\napi.admin.medico.com"]
    end

    subgraph DataStorage ["Shared Infrastructure"]
        SharedDB[("PostgreSQL Database (Neon / Supabase / RDS)\nshared: 'Product', 'ProductVariant', 'InventoryBatch'")]
        SharedRedis[("Redis Pub/Sub & Cache (Upstash)")]
    end

    AdminWeb -->|"REST API / Bearer JWT"| AdminAPI
    AdminAPI -->|"Reads & Updates Batches & Stock"| SharedDB
    AdminAPI -->|"Publishes 'inventory.updated'"| SharedRedis
    AdminAPI -->|"ISR Webhook /api/revalidate"| MedicoWeb
    MedicoWeb -->|"Reads Active Batches (FEFO)"| SharedDB
    MedicoAPI -->|"Publishes 'order.created' / 'stock.low'"| SharedRedis
    SharedRedis -->|"SSE Live Broadcast"| AdminWeb
```

---

## 2. Step 1: Connecting to Medico's PostgreSQL Database

Both the Medico customer storefront and Pharmico Admin share the same PostgreSQL database instance.

### A. Configure Environment Variables
In `apps/admin-api/.env` (and your production API environment):
```env
# Point to your Medico PostgreSQL instance
DATABASE_URL="postgresql://postgres:password@your-db-host:5432/medico_db?schema=public&sslmode=require"
DIRECT_URL="postgresql://postgres:password@your-db-host:5432/medico_db?schema=public&sslmode=require"

# Main Medico storefront URL for cache invalidation
MAIN_SITE_URL="https://medico.com"
REVALIDATE_SECRET="your_shared_secret_matching_medico"
```

### B. Run Migrations to Provision Admin Tables
Pharmico Admin introduces tables prefixed with `admin_` (`admin_users`, `admin_roles`, `admin_stock_movements`, etc.) without altering Medico's existing product tables:
```bash
# Push or migrate schema into the shared Medico DB
npm run db:migrate

# Seed Super Admin credentials and standard role permissions
npm run db:seed
```
Default Super Admin login:
- **Email**: `admin@pharmacy.com`
- **Password**: `Admin@123456`

---

## 3. Step 2: Deploying the Frontend on Vercel (`admin-web`)

The administrative frontend (`apps/admin-web`) is a Next.js 15 App Router application optimized for Vercel.

### A. Import into Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your GitHub repository (`pharmacy-admin`).
3. In **Project Configuration**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `apps/admin-web`.
   - Ensure **Include source files outside of the Root Directory** is **checked** (required for monorepo packages `@pharmacy-admin/shared`).

### B. Environment Variables on Vercel
Add the following in the Vercel Project Settings:
| Key | Example Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.admin.medico.com/api/v1` | URL where `admin-api` is hosted |
| `NEXT_PUBLIC_APP_NAME` | `Pharmico Admin Control Center` | Header & title label |
| `NEXT_PUBLIC_THEME_VARIANT` | `pharmacy-green` | Visual branding |

### C. Deploy
Click **Deploy**. Vercel will build and assign your domain (e.g. `admin.medico.com` or `pharmacy-admin.vercel.app`).

---

## 4. Step 3: Deploying the Backend API (`admin-api`)

Because `admin-api` handles persistent Server-Sent Events (SSE) connections, Redis pub/sub subscribers, and long-running inventory audits, it is deployed as a Node.js container on **Railway**, **Render**, or a **VPS**:

### Deploying on Railway (Recommended)
1. Go to [railway.app](https://railway.app) and create a **New Project** -> **Deploy from GitHub repo**.
2. Under service settings:
   - **Root Directory**: `apps/admin-api`
   - **Build Command**: `npm install && npm run build --workspace=@pharmacy-admin/admin-api`
   - **Start Command**: `npm run start --workspace=@pharmacy-admin/admin-api`
3. Add Environment Variables:
   - `DATABASE_URL`: Medico Postgres URL
   - `DIRECT_URL`: Medico Direct Postgres URL
   - `REDIS_URL`: Upstash Redis connection string
   - `JWT_ACCESS_SECRET`: 64-char random string
   - `JWT_REFRESH_SECRET`: 64-char random string
   - `MAIN_SITE_URL`: `https://medico.com`
   - `REVALIDATE_SECRET`: Shared revalidation token
   - `CORS_ORIGIN`: `https://admin.medico.com,https://pharmacy-admin.vercel.app`
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
4. Set custom domain: `api.admin.medico.com`.

---

## 5. Controlling Medico Inventory via Pharmico Admin

Once connected, Pharmico Admin has full control over Medico's inventory:

### 1. Batch & FEFO Tracking
- Medico customers only purchase from verified, non-expired, non-quarantined batches (`isBlocked: false`, `expiryDate > now`).
- Pharmico Admin organizes all batches by strict **FEFO (First-Expiry, First-Out)** so the earliest expiring stock is prioritized.

### 2. Stock Adjustments
- Navigate to `/inventory` in Pharmico Admin.
- Click **Adjust Stock** on any batch.
- Choose type:
  - `PURCHASE`: Adding newly received units from suppliers.
  - `DAMAGE`: Writing off broken/leaked bottles or blisters.
  - `CORRECTION`: Physical audit adjustment.
  - `EXPIRED`: Writing off expired medicines.
- **Immediate Effect**:
  1. The `InventoryBatch.quantity` is updated in the database.
  2. An audit trail entry is inserted into `admin_stock_movements`.
  3. `syncMutationToMainSite(...)` fires:
     - Publishes `inventory.updated` to Redis channel `store:events`.
     - Sends an HTTP POST to `${MAIN_SITE_URL}/api/revalidate` with `tags: ['products', 'inventory', 'product:<slug>']`.
     - Medico's Next.js storefront purges its cache and immediately displays the updated stock count to shoppers.

### 3. Quarantining Batches (Emergency Hold)
- If a manufacturer issues a recall or quality alert, click **Quarantine** on any batch in `/inventory`.
- `isBlocked` is set to `true`.
- Medico's storefront checkout immediately stops selling units from that specific batch while leaving other batches active.
