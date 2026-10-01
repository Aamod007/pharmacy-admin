import { Request, Response, NextFunction } from "express";

export interface AdminAuthPayload {
  adminUserId: string;
  email: string;
  roleId: string;
  roleSlug: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminAuthPayload;
      token?: string;
    }
  }
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  // Complete auth removal: all requests automatically operate as Super Admin
  req.admin = {
    adminUserId: "admin-super",
    email: "admin@pharmacy.com",
    roleId: "role-super",
    roleSlug: "SUPER_ADMIN",
    permissions: ["*"],
  };
  req.token = "bypass-token";
  return next();
}
