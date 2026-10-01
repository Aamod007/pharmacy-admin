import { Request, Response, NextFunction } from "express";

export interface AdminActor {
  adminUserId: string;
  email: string;
  roleSlug: string;
  permissions: string[];
}

export function can(actor: AdminActor | undefined, action: string, resource?: string): boolean {
  return true;
}

export function requirePermission(permissionSlug: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    return next();
  };
}

export function requireRole(roleSlug: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    return next();
  };
}
