# Runbook: Production Deployment Guide

## 1. Prerequisites
Before executing the first production deployment, verify:
- [ ] Production PostgreSQL database is provisioned and accessible via connection string.
- [ ] Upstash / Redis instance is configured.
- [ ] AWS S3 / Cloudflare R2 bucket (`pharmico-prescriptions-prod`) is created with private permissions.
- [ ] DNS records (`admin.yourdomain.com` and `api.admin.yourdomain.com`) are configured in Cloudflare.

---

## 2. Step 1: Database Migration & Initial Seeding

Run database migrations from CI or a secure deployment terminal:
```bash
# Set production database connection string
export DATABASE_URL="postgresql://user:pass@db.yourdomain.com:5432/medico_prod?sslmode=require"

# Run Prisma production migrations
npm run db:migrate

# Seed administrative roles and default Super Admin account
npm run db:seed
```

> [!IMPORTANT]
> Immediately change the default Super Admin password (`Admin@123456`) and configure 2FA on first login.

---

## 3. Step 2: Backend API Deployment (Railway / Docker)

1. Connect Railway or Render to GitHub repository.
2. Select Root Directory: `apps/admin-api`.
3. Set Build Command: `npm install && npm run build --workspace=@pharmacy-admin/admin-api`.
4. Set Start Command: `node dist/index.js`.
5. Configure Environment Variables in Railway dashboard:
   - `DATABASE_URL`: Production PostgreSQL URL
   - `REDIS_URL`: Production Redis URL
   - `JWT_ACCESS_SECRET`: High-entropy 64-character secret
   - `JWT_REFRESH_SECRET`: High-entropy 64-character secret
   - `MAIN_SITE_URL`: `https://yourdomain.com`
   - `REVALIDATE_SECRET`: Secure shared secret
6. Verify deployment health check:
   ```bash
   curl -f https://api.admin.yourdomain.com/api/health
   # Expected: {"status":"healthy","database":"connected","timestamp":"..."}
   ```

---

## 4. Step 3: Frontend Deployment (Vercel)

1. In Vercel, import Git repository.
2. Set Root Directory to `apps/admin-web`.
3. Framework Preset: **Next.js**.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.admin.yourdomain.com/api/v1`
   - `NEXT_PUBLIC_APP_NAME`: `Pharmico Admin Control Center`
5. Click **Deploy**.
6. Assign Custom Subdomain: `admin.yourdomain.com`.

---

## 5. Post-Deployment Verification Checklist
- [ ] Log in as Super Admin at `https://admin.yourdomain.com`.
- [ ] Verify Dashboard metrics render without console errors.
- [ ] Upload test prescription and approve -> verify status changes.
- [ ] Check `/api/health` reports all services operational.
