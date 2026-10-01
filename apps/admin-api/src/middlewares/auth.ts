import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "@pharmacy-admin/db";
import { env } from "../config/env";

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

const adminAuthCache = new Map<string, { payload: AdminAuthPayload; expiresAt: number }>();

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AdminAuthPayload;

    // Check fast in-memory cache first
    const now = Date.now();
    const cached = adminAuthCache.get(decoded.adminUserId);
    if (cached && now < cached.expiresAt) {
      req.admin = cached.payload;
      req.token = token;
      return next();
    }

    // Verify admin user is still active in database
    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.adminUserId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      adminAuthCache.delete(decoded.adminUserId);
      return res.status(403).json({ success: false, message: "Account disabled or deleted" });
    }

    const payload: AdminAuthPayload = {
      adminUserId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleSlug: user.role.slug,
      permissions: user.role.permissions.map((rp) => rp.permission.slug),
    };

    // Cache for 30 seconds
    adminAuthCache.set(decoded.adminUserId, { payload, expiresAt: now + 30000 });

    req.admin = payload;
    req.token = token;

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid authentication token" });
  }
}
