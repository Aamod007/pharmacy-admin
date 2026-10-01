# 🏥 Pharmico Standalone Admin Control Center (`pharmacy-admin`)

An enterprise-grade, standalone administration center built with Next.js 15 App Router, Node.js 20, Express, Prisma ORM, BullMQ, and Redis pub/sub. It deploys completely decoupled from the main customer-facing storefront on its own subdomain (`admin.<client-domain>`).

---

## 🏗️ Architecture & Communication Channels

The admin system connects to the main medical e-commerce storefront via 4 primary channels:

1. **Shared PostgreSQL Database**: Direct read/write access to storefront tables (`Product`, `Order`, `User`, `Prescription`, etc.).
2. **Additive Admin Tables**: All new models are non-destructively partitioned with the `admin_` prefix (`admin_users`, `admin_roles`, `admin_sessions`, `admin_audit_logs`, `admin_stock_movements`, etc.).
3. **Instant Cache Invalidation (ISR)**: On any catalog mutation (product, category, brand, coupon, banner, settings), the Admin API calls `POST {MAIN_SITE_URL}/api/revalidate` with an `x-revalidate-secret` header and publishes a typed JSON event to Redis channel `store:events`.
4. **Real-Time Storefront Ingestion via SSE**: Subscribes to Redis channel `store:orders` (`order.created`, `prescription.uploaded`, `stock.low`, `payment.captured`) and fans them out to connected admin browser sessions via Server-Sent Events (`/api/v1/events`).

---

## 📁 Monorepo Layout

```
pharmacy-admin/
├── apps/
│   ├── admin-web/       # Next.js 15 (App Router), Tailwind, Zustand, TanStack Query/Table
│   └── admin-api/       # Node 20, Express, Prisma, BullMQ, otplib 2FA, JWT
├── packages/
│   ├── db/              # Prisma schema, additive SQL migrations, seed scripts
│   └── shared/          # Shared Zod validation schemas, business enums, API types
├── docker-compose.yml   # Web, API, and Redis orchestration
└── tests/               # Unit, integration, and Playwright E2E test suites
```

---

## 🚀 Quickstart & Local Setup

### 1. Install Monorepo Dependencies
```bash
cd pharmacy-admin
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Apply Additive Database Migrations & Seed Default Roles
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

> **Default Super Administrator Credentials:**
> - **Email:** `admin@pharmacy.com`
> - **Password:** `Admin@123456`

### 4. Run Development Servers
```bash
npm run dev
```
- Admin Web: [http://localhost:3001](http://localhost:3001)
- Admin API: [http://localhost:5001](http://localhost:5001)
- OpenAPI Swagger UI: [http://localhost:5001/api/docs](http://localhost:5001/api/docs)

---

## 🔒 Role-Based Access Control (RBAC) Matrix

| Module | SUPER_ADMIN | ADMIN | PHARMACIST | INVENTORY_MANAGER | SUPPORT | MARKETING |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Prescriptions** | CRUD + Export | CRUD + Export | Read + Approve/Reject | — | Read | — |
| **Orders** | Full | Full | Read + Status Update | Read | Read + Notes | — |
| **Inventory / Batches** | Full | Full | Read | Full (FEFO Adjustments) | — | — |
| **Products & Catalog** | Full | Full | Read | Full | — | — |
| **Customers** | Full | Full | Read | — | Read + Notes | — |
| **Coupons & Banners** | Full | Full | — | — | — | Full |
| **Staff & Roles** | Full | Read + Invite | — | — | — | — |
| **Store Settings** | Full | Full | — | — | — | — |

---

## 📦 Deployment Instructions

### Web (Vercel)
Set the Root Directory to `apps/admin-web` in project settings. Add:
```
NEXT_PUBLIC_API_URL=https://api.admin.yourdomain.com/api/v1
NEXT_PUBLIC_APP_NAME="Pharmico Admin"
```

### API (Railway / VPS)
Set Dockerfile path to `apps/admin-api/Dockerfile`. Configure:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MAIN_SITE_URL=https://yourdomain.com
REVALIDATE_SECRET=...
INTERNAL_API_KEY=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

### DNS Configuration
- `admin.yourdomain.com` -> CNAME to Vercel
- `api.admin.yourdomain.com` -> CNAME to Railway / VPS
