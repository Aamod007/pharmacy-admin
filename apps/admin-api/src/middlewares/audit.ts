import { Request, Response, NextFunction } from "express";
import { recordAuditLog } from "../lib/audit";

export function auditMiddleware(entity: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
        const entityId = req.params.id || body?.data?.id || undefined;
        recordAuditLog({
          adminUserId: req.admin?.adminUserId,
          action,
          entity,
          entityId,
          beforeState: req.body,
          afterState: body.data,
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
      }
      return originalJson(body);
    };

    next();
  };
}
