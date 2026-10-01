import prisma from "@pharmacy-admin/db";

interface RecordAuditLogOptions {
  adminUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAuditLog(options: RecordAuditLogOptions) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: options.adminUserId,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        beforeState: options.beforeState ? JSON.parse(JSON.stringify(options.beforeState)) : undefined,
        afterState: options.afterState ? JSON.parse(JSON.stringify(options.afterState)) : undefined,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  } catch (err: any) {
    console.error("Failed to record audit log:", err.message);
  }
}
