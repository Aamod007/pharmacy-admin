import { Request, Response, NextFunction } from "express";

export function requirePermission(permissionSlug: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // SUPER_ADMIN role bypasses individual checks
    if (req.admin.roleSlug === "SUPER_ADMIN") {
      return next();
    }

    if (!req.admin.permissions.includes(permissionSlug)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: missing permission '${permissionSlug}'`,
      });
    }

    next();
  };
}

export function requireRole(roleSlug: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.admin.roleSlug === "SUPER_ADMIN" || req.admin.roleSlug === roleSlug) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: requires '${roleSlug}' role`,
    });
  };
}
