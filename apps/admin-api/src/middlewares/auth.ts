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

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentication required",
      error: { code: "UNAUTHORIZED", message: "No access token provided", details: [] },
    });
  }

  // 3. Verify JWT signature, expiration, and algorithm
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as any;

    if (!decoded.adminUserId || !decoded.roleSlug) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid admin token claims",
        error: { code: "INVALID_TOKEN", message: "Token does not possess required administrative claims", details: [] },
      });
    }

    req.admin = {
      adminUserId: decoded.adminUserId,
      email: decoded.email,
      roleId: decoded.roleId,
      roleSlug: decoded.roleSlug,
      permissions: decoded.permissions || [],
    };
    req.token = token;

    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token has expired",
        error: { code: "TOKEN_EXPIRED", message: "Access token expired. Please refresh your session.", details: [] },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or tampered token",
      error: { code: "INVALID_TOKEN", message: err.message, details: [] },
    });
  }
}
