import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!env.ADMIN_ALLOWED_IPS || env.ADMIN_ALLOWED_IPS.trim() === "") {
    return next();
  }

  const allowed = env.ADMIN_ALLOWED_IPS.split(",").map((ip) => ip.trim());
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "";

  if (!allowed.includes(clientIp) && !allowed.includes("127.0.0.1") && clientIp !== "::1") {
    console.warn(`Unauthorized IP blocked: ${clientIp}`);
    return res.status(403).json({ success: false, message: "Access denied by network security policy" });
  }

  next();
}
