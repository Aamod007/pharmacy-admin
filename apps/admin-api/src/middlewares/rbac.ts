import { Request, Response, NextFunction } from "express";

export interface AdminActor {
  adminUserId: string;
  email: string;
  roleSlug: string;
  permissions: string[];
}

/**
 * Central authorization check function as mandated by Playbook Layer 4.
 * Validates whether a given actor has permission to perform an action on a resource.
 */
export function can(actor: AdminActor | undefined, action: string, resource?: string): boolean {
  if (!actor) return false;
  if (actor.roleSlug === "SUPER_ADMIN") return true;

  const targetPermission = resource ? `${resource}:${action}` : action;
  return actor.permissions.includes(targetPermission) || actor.permissions.includes(action);
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

    if (req.admin.roleSlug === "SUPER_ADMIN" || req.admin.roleSlug === roleSlug) {
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
