import { Request, Response, NextFunction } from "express";

export interface AdminActor {
  adminUserId: string;
  email: string;
  roleSlug: string;
  permissions: string[];
}

export function can(actor: AdminActor | undefined, action: string, resource?: string): boolean {
  if (!actor) return false;
  if (actor.roleSlug === "SUPER_ADMIN" || actor.roleSlug === "ADMIN" || actor.permissions?.includes("*")) return true;

  const targetPermission = resource ? `${resource}:${action}` : action;
  return (
    (actor.permissions && (actor.permissions.includes(targetPermission) || actor.permissions.includes(action))) ||
    false
  );
}

export function requirePermission(permissionSlug: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: [] },
      });
    }

    if (can(req.admin, permissionSlug)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: missing permission '${permissionSlug}'`,
      error: {
        code: "FORBIDDEN",
        message: `You do not have permission '${permissionSlug}' to perform this action.`,
        details: [],
      },
    });
  };
}

export function requireRole(roleSlug: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED", message: "Authentication required", details: [] },
      });
    }

    if (req.admin.roleSlug === "SUPER_ADMIN" || req.admin.roleSlug === "ADMIN" || req.admin.roleSlug === roleSlug) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: requires '${roleSlug}' role`,
      error: {
        code: "FORBIDDEN",
        message: `Access restricted to users with role '${roleSlug}'.`,
        details: [],
      },
    });
  };
}
