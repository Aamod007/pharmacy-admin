# Runbook: Emergency Rollback Procedures

## 1. Overview
This runbook details the protocol for executing an emergency rollback across the three tiers of the Pharmico Admin platform: Vercel Frontend, Railway/VPS Backend API, and PostgreSQL Database Migrations.

---

## 2. Frontend Rollback (Vercel)

Vercel provides instant atomic rollbacks without rebuilding:
1. Open the **Vercel Project Dashboard** -> **Deployments**.
2. Identify the last known healthy deployment (marked by green checkmark and previous commit hash).
3. Click the **`...`** menu on the target healthy deployment -> select **Instant Rollback**.
4. Confirm the prompt. Traffic switches instantly (< 5 seconds) at the edge.

---

## 3. Backend API Rollback (Railway / Docker VPS)

### Scenario A: Railway Hosted API
1. Navigate to Railway Project -> `admin-api` service.
2. Under the **Deployments** tab, locate the prior stable deployment.
3. Click **Redeploy** on the historical release.
4. Verify the health check: `curl -I https://api.admin.pharmico.com/api/health`.

### Scenario B: Docker / VPS Self-Hosted API
```bash
# SSH into API server host
ssh deploy@api.admin.pharmico.com

# Re-tag and deploy previous Docker image container
docker stop pharmico-admin-api-current
docker run -d --name pharmico-admin-api-new \
  --restart unless-stopped \
  -p 5001:5001 \
  --env-file /etc/pharmico/.env \
  ghcr.io/pharmico/admin-api:v1.0.4

# Verify live health check
curl http://localhost:5001/api/health
```

---

## 4. Database Migration Rollback Strategy

> [!CAUTION]
> Never roll back database migrations if the new schema has already ingested active customer transactions without taking an immediate pre-rollback snapshot.

### Step 1: Capture Pre-Rollback Dump
```bash
pg_dump -U postgres -d medico_db -Fc > emergency_prerollback_$(date +%s).dump
```

### Step 2: Revert Prisma Migration
Prisma uses sequential migration history. To revert a failed migration:
1. Identify the offending SQL in `packages/db/prisma/migrations/<migration_name>/migration.sql`.
2. Write a compensating down-migration script `down.sql`.
3. Apply `down.sql`:
   ```bash
   psql -U postgres -d medico_db -f down.sql
   ```
4. Update the Prisma migrations tracking table:
   ```sql
   DELETE FROM "_prisma_migrations" WHERE migration_name = '<offending_migration_name>';
   ```
5. Mark the migration as resolved:
   ```bash
   npx prisma migrate resolve --rolled-back "<offending_migration_name>"
   ```
