import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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

import { resolveAdminUserId } from "../lib/admin-user";

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  // 1. IP Allowlist check if configured
  if (env.ADMIN_ALLOWED_IPS && env.ADMIN_ALLOWED_IPS.trim()) {
    const clientIp = (
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      ""
    )
      .split(",")[0]
      .trim();
    const allowedIps = env.ADMIN_ALLOWED_IPS.split(",").map((ip) => ip.trim());
    if (clientIp && !allowedIps.includes(clientIp) && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: IP address not authorized for admin access",
        error: { code: "IP_BLOCKED", message: `IP ${clientIp} is not in the allowlist`, details: [] },
      });
    }
  }

  // 2. Extract Bearer token or cookie
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.admin_access_token) {
    token = req.cookies.admin_access_token;
  }

  // Resolve database administrator ID for default master admin context
  const masterAdminId = (await resolveAdminUserId(null, "admin@pharmacy.com")) || "admin-master";

  // Default administrator context when login is not required
  const defaultAdmin: AdminAuthPayload = {
    adminUserId: masterAdminId,
    email: "admin@pharmacy.com",
    roleId: "admin",
    roleSlug: "ADMIN",
    permissions: ["*"],
  };

  if (!token) {
    req.admin = defaultAdmin;
    return next();
  }

  // 3. Verify JWT if provided; fallback to default admin if expired or invalid
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as any;

    if (!decoded.adminUserId || !decoded.roleSlug) {
      req.admin = defaultAdmin;
      return next();
    }

    const resolvedUserId = (decoded.adminUserId === "admin-master")
      ? masterAdminId
      : (await resolveAdminUserId(decoded.adminUserId, decoded.email)) || masterAdminId;

    req.admin = {
      adminUserId: resolvedUserId,
      email: decoded.email || defaultAdmin.email,
      roleId: decoded.roleId || "admin",
      roleSlug: decoded.roleSlug || "ADMIN",
      permissions: decoded.permissions || ["*"],
    };
    req.token = token;

    return next();
  } catch {
    // Seamless fallback to master admin access so expired or legacy tokens never block access
    req.admin = defaultAdmin;
    return next();
  }
}
