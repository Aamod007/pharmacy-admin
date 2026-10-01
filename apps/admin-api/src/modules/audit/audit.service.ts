import prisma from "@pharmacy-admin/db";

export class AuditService {
  async listLogs(params: { page?: number; limit?: number; entity?: string; action?: string }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          adminUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const auditService = new AuditService();
