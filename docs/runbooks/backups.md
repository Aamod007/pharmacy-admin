# Runbook: Database Backups & Point-in-Time Recovery (PITR)

## 1. Overview
This runbook defines the backup policy, automated retention schedule, and step-by-step restoration procedures for the Pharmico PostgreSQL database (`medico_db`).

---

## 2. Backup Strategy & Cadence

| Tier | Backup Type | Frequency | Retention | Storage Destination |
|---|---|---|---|---|
| **Tier 1: WAL Streaming** | Continuous Write-Ahead Logs | Every 60 seconds | 7 days | Encrypted S3 Bucket (`pharmico-backups/wal/`) |
| **Tier 2: Daily Full Dump** | Compressed `pg_dump` snapshot | Daily at 02:00 UTC | 30 days | S3 Bucket with Immutable Object Lock |
| **Tier 3: Monthly Archive** | Full snapshot | 1st of every month | 12 months | AWS S3 Glacier Deep Archive |

---

## 3. Step-by-Step Restoration Procedure

### Scenario: Restoring Backup to Staging / Drill Verification Database

> [!WARNING]
> Never restore directly into the live production database. Always restore into a clean staging instance (`medico_db_restore_test`) to verify data integrity before initiating any production cutover.

#### Step 1: Download the Target Backup Snapshot
```bash
# Retrieve latest verified daily dump from secure S3
aws s3 cp s3://pharmico-backups/daily/medico_db_2026-10-01.dump.gz ./backup.dump.gz

# Decompress dump file
gunzip backup.dump.gz
```

#### Step 2: Provision Isolated Verification Database
```bash
# Connect to PostgreSQL host as superuser
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS medico_db_restore_test;"
psql -U postgres -h localhost -c "CREATE DATABASE medico_db_restore_test OWNER postgres;"
```

#### Step 3: Execute pg_restore
```bash
pg_restore --verbose --clean --no-acl --no-owner \
  -h localhost \
  -U postgres \
  -d medico_db_restore_test \
  ./backup.dump
```

#### Step 4: Verify Table Counts and Data Integrity
Run verification queries to confirm zero record loss:
```sql
\c medico_db_restore_test;

-- 1. Check administrative tables exist and have records
SELECT count(*) FROM "admin_users";
SELECT count(*) FROM "admin_roles";
SELECT count(*) FROM "admin_audit_logs";

-- 2. Verify recent orders and inventory batches
SELECT count(*) FROM "Order";
SELECT count(*) FROM "Batch" WHERE "isBlocked" = false;

-- 3. Verify foreign key integrity
SELECT b.id, b."batchNumber", p.name 
FROM "Batch" b 
LEFT JOIN "Product" p ON b."productId" = p.id 
WHERE p.id IS NULL; -- Must return 0 rows
```

---

## 4. Automated Backup Verification Script

Save this script as `scripts/test-backup-restore.sh` to run automated weekly drills in CI/staging:

```bash
#!/bin/bash
set -e

BACKUP_FILE=$1
TEST_DB="medico_drill_$(date +%s)"

echo "🔄 [1/4] Creating drill database: $TEST_DB..."
createdb -U postgres "$TEST_DB"

echo "📦 [2/4] Restoring snapshot..."
pg_restore -U postgres -d "$TEST_DB" "$BACKUP_FILE"

echo "🧪 [3/4] Running schema integrity checks..."
COUNT=$(psql -U postgres -d "$TEST_DB" -t -A -c 'SELECT count(*) FROM "admin_users";')

if [ "$COUNT" -gt 0 ]; then
  echo "✅ Restore drill successful! Found $COUNT admin records."
else
  echo "❌ Drill failed: admin_users is empty!"
  dropdb -U postgres "$TEST_DB"
  exit 1
fi

echo "🧹 [4/4] Cleaning up drill database..."
dropdb -U postgres "$TEST_DB"
echo "🎉 Backup verification completed successfully."
```
