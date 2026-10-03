export interface RecordAuditLogOptions {
  adminUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAuditLog(_options: RecordAuditLogOptions): Promise<void> {
  // Audit logging removed
}

