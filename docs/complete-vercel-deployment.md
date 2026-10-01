# Complete 100% Vercel Deployment Guide

This guide explains how to deploy **both the Frontend and Backend API** of **Pharmico Admin** entirely on **Vercel** with zero external compute providers (no Railway, no Render, no VPS).

---

## 1. Architecture on Vercel

```mermaid
graph TD
    subgraph VercelCloud ["Vercel Cloud (100% Serverless)"]
        subgraph Project1 ["Project: admin-web (Next.js 15)"]
            Frontend["Admin Dashboard UI\n(admin-web.vercel.app)"]
            EdgeRewrites["Next.js Edge Proxy / Rewrites\n/api/v1/* -> API"]
        end

        subgraph Project2 ["Project: admin-api (Node.js Serverless)"]
            APIHandler["Serverless Express Handler\n(admin-api.vercel.app)\napps/admin-api/api/index.ts"]
        end
    end

    subgraph DataTier ["Shared Medico Infrastructure"]
        PostgresDB[("PostgreSQL Database (Neon / Supabase / AWS)\nStores 'Product', 'InventoryBatch', 'Order', etc.")]
        MainSite["Medico Next.js Storefront (medico.com)"]
    end

    Browser["Admin User Browser"] -->|"1. Opens Dashboard"| Frontend
    Frontend -->|"2. Relative API calls (/api/v1/...)"| EdgeRewrites
    EdgeRewrites -->|"3. Server-to-server proxy"| APIHandler
    APIHandler -->|"4. Reads/Updates Batches (FEFO)"| PostgresDB
    APIHandler -->|"5. Triggers ISR /api/revalidate"| MainSite
```

---

## 2. Step 1: Deploy Backend API on Vercel (`admin-api`)

The backend API is configured as a Vercel Serverless Function running Express via `apps/admin-api/api/index.ts` and `apps/admin-api/vercel.json`.

1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your GitHub repository (`pharmacy-admin`).
3. Set **Project Name**: `pharmacy-admin-api` (or your preferred name).
4. In **Project Settings**:
   - **Framework Preset**: `Other`
   - **Root Directory**: Click *Edit* and select **`apps/admin-api`**.
   - Make sure **"Include source files outside of the Root Directory"** is **CHECKED**.
5. Expand **Environment Variables** and add:
   ```env
   DATABASE_URL="postgresql://postgres:password@your-db-host:5432/medico_db?schema=public&sslmode=require"
   DIRECT_URL="postgresql://postgres:password@your-db-host:5432/medico_db?schema=public&sslmode=require"
   JWT_ACCESS_SECRET="generate_a_random_32_plus_character_string_here"
   JWT_REFRESH_SECRET="generate_another_random_32_plus_character_string_here"
   MAIN_SITE_URL="https://medico.com"
   REVALIDATE_SECRET="your_shared_revalidation_secret"
   NODE_ENV="production"
   CORS_ORIGIN="*"
   ```
6. Click **Deploy**.
7. Note down your assigned Vercel URL (e.g. `https://pharmacy-admin-api.vercel.app`).

---

## 3. Step 2: Deploy Frontend on Vercel (`admin-web`)

1. In Vercel, click **Add New...** -> **Project**.
2. Select the **same GitHub repository** (`pharmacy-admin`).
3. Set **Project Name**: `pharmacy-admin-web` (or `pharmacy-admin`).
4. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`apps/admin-web`**.
   - Ensure **"Include source files outside of the Root Directory"** is **CHECKED**.
5. Expand **Environment Variables** and add:
   ```env
   NEXT_PUBLIC_API_URL="https://pharmacy-admin-api.vercel.app/api/v1"
   API_SERVER_URL="https://pharmacy-admin-api.vercel.app"
   NEXT_PUBLIC_APP_NAME="Pharmico Admin Control Center"
   NEXT_PUBLIC_THEME_VARIANT="pharmacy-green"
   ```
   *(Replace `https://pharmacy-admin-api.vercel.app` with the URL from Step 1)*.
6. Click **Deploy**.
7. Your Admin dashboard is now live (e.g. `https://pharmacy-admin-web.vercel.app`).

---

## 4. Step 3: Run Database Migrations on the Medico Database

Before logging in, make sure the `admin_*` tables are created in your shared PostgreSQL database.

From your local machine or CI terminal:
```bash
# Set your production database URL
$env:DATABASE_URL="postgresql://postgres:password@your-db-host:5432/medico_db?schema=public&sslmode=require"

# Push schema to create admin tables without touching Medico customer data
npx prisma db push --schema=packages/db/prisma/schema.prisma

# Seed Super Admin credentials and permissions
npm run db:seed
```

Default Super Admin Login:
- **Email**: `admin@pharmacy.com`
- **Password**: `Admin@123456`

---

## 5. Verification: Controlling Medico Inventory

1. Log in at your Vercel frontend URL (`https://pharmacy-admin-web.vercel.app/login`).
2. Navigate to `/inventory`:
   - You will see all Medico medicine variants and their batches sorted by **FEFO (First-Expiry, First-Out)**.
3. Test a Stock Adjustment:
   - Click **Adjust Stock** on any batch.
   - Enter quantity and select a reason (e.g., `PURCHASE` or `CORRECTION`).
   - Click **Submit**.
   - Pharmico Admin updates the stock in the shared PostgreSQL database and automatically notifies Medico via `/api/revalidate`.
4. Test Quarantining a Batch:
   - Click the lock icon on a batch to quarantine it.
   - The batch is flagged `isBlocked: true`.
   - Medico storefront immediately stops selling from this batch while keeping other batches available.
