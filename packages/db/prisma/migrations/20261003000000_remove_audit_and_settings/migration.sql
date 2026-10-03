-- Drop foreign key constraints
ALTER TABLE IF EXISTS "admin_audit_logs" DROP CONSTRAINT IF EXISTS "admin_audit_logs_adminUserId_fkey";

-- Drop admin_audit_logs table
DROP TABLE IF EXISTS "admin_audit_logs" CASCADE;

-- Drop Setting table
DROP TABLE IF EXISTS "Setting" CASCADE;
