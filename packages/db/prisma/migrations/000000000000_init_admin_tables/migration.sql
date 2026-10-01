-- ==============================================================================
-- ADDITIVE MIGRATION FOR ADMIN CONTROL CENTER TABLES
-- Safe to run against the main storefront PostgreSQL database.
-- ==============================================================================

-- Create Admin Enums (if not exists)
DO $$ BEGIN
    CREATE TYPE "AdminStockMovementType" AS ENUM ('PURCHASE', 'SALE', 'RETURN_RESTOCK', 'DAMAGE', 'EXPIRED', 'CORRECTION', 'AUDIT_ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminPurchaseStatus" AS ENUM ('DRAFT', 'RECEIVED', 'VERIFIED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminSenderType" AS ENUM ('ADMIN', 'CUSTOMER', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminNotificationChannel" AS ENUM ('EMAIL', 'SMS', 'SSE', 'REDIS_SYNC', 'REVALIDATION_WEBHOOK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminNotificationStatus" AS ENUM ('SUCCESS', 'FAILED', 'RETRYING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminWebhookSource" AS ENUM ('RAZORPAY', 'SHIPROCKET', 'MAIN_SITE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminImportType" AS ENUM ('PRODUCTS', 'INVENTORY_BATCHES', 'PINCODES', 'PRICES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminCreditNoteStatus" AS ENUM ('ISSUED', 'APPLIED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. admin_roles
CREATE TABLE IF NOT EXISTS "admin_roles" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "admin_roles_slug_idx" ON "admin_roles"("slug");

-- 2. admin_permissions
CREATE TABLE IF NOT EXISTS "admin_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_permissions_module_action_unique" UNIQUE ("module", "action")
);
CREATE INDEX IF NOT EXISTS "admin_permissions_slug_idx" ON "admin_permissions"("slug");

-- 3. admin_role_permissions
CREATE TABLE IF NOT EXISTS "admin_role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_role_permissions_role_permission_unique" UNIQUE ("roleId", "permissionId"),
    FOREIGN KEY ("roleId") REFERENCES "admin_roles"("id") ON DELETE CASCADE,
    FOREIGN KEY ("permissionId") REFERENCES "admin_permissions"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "admin_role_permissions_roleId_idx" ON "admin_role_permissions"("roleId");
CREATE INDEX IF NOT EXISTS "admin_role_permissions_permissionId_idx" ON "admin_role_permissions"("permissionId");

-- 4. admin_users
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    FOREIGN KEY ("roleId") REFERENCES "admin_roles"("id")
);
CREATE INDEX IF NOT EXISTS "admin_users_email_idx" ON "admin_users"("email");
CREATE INDEX IF NOT EXISTS "admin_users_roleId_idx" ON "admin_users"("roleId");
CREATE INDEX IF NOT EXISTS "admin_users_isActive_idx" ON "admin_users"("isActive");

-- 5. admin_sessions
CREATE TABLE IF NOT EXISTS "admin_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "admin_sessions_adminUserId_idx" ON "admin_sessions"("adminUserId");
CREATE INDEX IF NOT EXISTS "admin_sessions_tokenHash_idx" ON "admin_sessions"("tokenHash");
CREATE INDEX IF NOT EXISTS "admin_sessions_expiresAt_idx" ON "admin_sessions"("expiresAt");

-- 6. admin_audit_logs
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_adminUserId_idx" ON "admin_audit_logs"("adminUserId");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_entity_idx" ON "admin_audit_logs"("entity");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- 7. admin_suppliers
CREATE TABLE IF NOT EXISTS "admin_suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL UNIQUE,
    "code" TEXT NOT NULL UNIQUE,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "gstin" TEXT,
    "drugLicenceNo" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "admin_suppliers_code_idx" ON "admin_suppliers"("code");
CREATE INDEX IF NOT EXISTS "admin_suppliers_isActive_idx" ON "admin_suppliers"("isActive");

-- 8. admin_stock_movements
CREATE TABLE IF NOT EXISTS "admin_stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "variantId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" "AdminStockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "reason" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE,
    FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL,
    FOREIGN KEY ("createdByAdminId") REFERENCES "admin_users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "admin_stock_movements_variantId_idx" ON "admin_stock_movements"("variantId");
CREATE INDEX IF NOT EXISTS "admin_stock_movements_batchId_idx" ON "admin_stock_movements"("batchId");
CREATE INDEX IF NOT EXISTS "admin_stock_movements_type_idx" ON "admin_stock_movements"("type");
CREATE INDEX IF NOT EXISTS "admin_stock_movements_createdAt_idx" ON "admin_stock_movements"("createdAt");

-- 9. admin_purchase_entries
CREATE TABLE IF NOT EXISTS "admin_purchase_entries" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "supplierId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "AdminPurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("supplierId") REFERENCES "admin_suppliers"("id"),
    FOREIGN KEY ("createdByAdminId") REFERENCES "admin_users"("id")
);
CREATE INDEX IF NOT EXISTS "admin_purchase_entries_invoiceNumber_idx" ON "admin_purchase_entries"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "admin_purchase_entries_supplierId_idx" ON "admin_purchase_entries"("supplierId");
CREATE INDEX IF NOT EXISTS "admin_purchase_entries_status_idx" ON "admin_purchase_entries"("status");

-- 10. admin_purchase_items
CREATE TABLE IF NOT EXISTS "admin_purchase_items" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "purchaseEntryId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "mfgDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "freeQuantity" INTEGER NOT NULL DEFAULT 0,
    "purchaseRate" DECIMAL(10,2) NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("purchaseEntryId") REFERENCES "admin_purchase_entries"("id") ON DELETE CASCADE,
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
);
CREATE INDEX IF NOT EXISTS "admin_purchase_items_purchaseEntryId_idx" ON "admin_purchase_items"("purchaseEntryId");
CREATE INDEX IF NOT EXISTS "admin_purchase_items_variantId_idx" ON "admin_purchase_items"("variantId");

-- 11. admin_support_tickets
CREATE TABLE IF NOT EXISTS "admin_support_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticketNumber" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "priority" "AdminTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AdminTicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("assignedToAdminId") REFERENCES "admin_users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "admin_support_tickets_ticketNumber_idx" ON "admin_support_tickets"("ticketNumber");
CREATE INDEX IF NOT EXISTS "admin_support_tickets_customerId_idx" ON "admin_support_tickets"("customerId");
CREATE INDEX IF NOT EXISTS "admin_support_tickets_status_idx" ON "admin_support_tickets"("status");
CREATE INDEX IF NOT EXISTS "admin_support_tickets_assignedToAdminId_idx" ON "admin_support_tickets"("assignedToAdminId");

-- 12. admin_ticket_messages
CREATE TABLE IF NOT EXISTS "admin_ticket_messages" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticketId" TEXT NOT NULL,
    "senderType" "AdminSenderType" NOT NULL DEFAULT 'ADMIN',
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isInternalNote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ticketId") REFERENCES "admin_support_tickets"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "admin_ticket_messages_ticketId_idx" ON "admin_ticket_messages"("ticketId");
CREATE INDEX IF NOT EXISTS "admin_ticket_messages_createdAt_idx" ON "admin_ticket_messages"("createdAt");

-- 13. admin_email_templates
CREATE TABLE IF NOT EXISTS "admin_email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "admin_email_templates_slug_idx" ON "admin_email_templates"("slug");
CREATE INDEX IF NOT EXISTS "admin_email_templates_category_idx" ON "admin_email_templates"("category");

-- 14. admin_notification_logs
CREATE TABLE IF NOT EXISTS "admin_notification_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "channel" "AdminNotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "AdminNotificationStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "admin_notification_logs_channel_idx" ON "admin_notification_logs"("channel");
CREATE INDEX IF NOT EXISTS "admin_notification_logs_status_idx" ON "admin_notification_logs"("status");
CREATE INDEX IF NOT EXISTS "admin_notification_logs_eventType_idx" ON "admin_notification_logs"("eventType");
CREATE INDEX IF NOT EXISTS "admin_notification_logs_createdAt_idx" ON "admin_notification_logs"("createdAt");

-- 15. admin_webhook_events
CREATE TABLE IF NOT EXISTS "admin_webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "source" "AdminWebhookSource" NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "AdminWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "processingError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "admin_webhook_events_source_idx" ON "admin_webhook_events"("source");
CREATE INDEX IF NOT EXISTS "admin_webhook_events_status_idx" ON "admin_webhook_events"("status");
CREATE INDEX IF NOT EXISTS "admin_webhook_events_eventId_idx" ON "admin_webhook_events"("eventId");

-- 16. admin_import_jobs
CREATE TABLE IF NOT EXISTS "admin_import_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" "AdminImportType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorReport" JSONB,
    "status" "AdminImportStatus" NOT NULL DEFAULT 'PENDING',
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    FOREIGN KEY ("createdByAdminId") REFERENCES "admin_users"("id")
);
CREATE INDEX IF NOT EXISTS "admin_import_jobs_type_idx" ON "admin_import_jobs"("type");
CREATE INDEX IF NOT EXISTS "admin_import_jobs_status_idx" ON "admin_import_jobs"("status");
CREATE INDEX IF NOT EXISTS "admin_import_jobs_createdByAdminId_idx" ON "admin_import_jobs"("createdByAdminId");

-- 17. admin_credit_notes
CREATE TABLE IF NOT EXISTS "admin_credit_notes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "creditNoteNumber" TEXT NOT NULL UNIQUE,
    "orderId" TEXT NOT NULL,
    "refundId" TEXT,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" "AdminCreditNoteStatus" NOT NULL DEFAULT 'ISSUED',
    "pdfUrl" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("orderId") REFERENCES "Order"("id"),
    FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE SET NULL,
    FOREIGN KEY ("createdByAdminId") REFERENCES "admin_users"("id")
);
CREATE INDEX IF NOT EXISTS "admin_credit_notes_creditNoteNumber_idx" ON "admin_credit_notes"("creditNoteNumber");
CREATE INDEX IF NOT EXISTS "admin_credit_notes_orderId_idx" ON "admin_credit_notes"("orderId");
CREATE INDEX IF NOT EXISTS "admin_credit_notes_status_idx" ON "admin_credit_notes"("status");
