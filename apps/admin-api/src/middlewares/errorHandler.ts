import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "../lib/logger";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const reqId = (req as any).id || (req.headers["x-request-id"] as string) || "unknown";

  logger.error("Admin API Error occurred", {
    requestId: reqId,
    path: req.path,
    method: req.method,
    errorMessage: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: formatted,
      },
      requestId: reqId,
    });
  }

  if (err?.name === "PrismaClientKnownRequestError" || (err && typeof err === "object" && typeof (err as any).code === "string" && (err as any).code.startsWith("P"))) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      return res.status(409).json({
        success: false,
        message: `A record with this ${target} already exists.`,
        error: {
          code: "CONFLICT",
          message: `A record with this ${target} already exists.`,
          details: err.meta,
        },
        requestId: reqId,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "The requested record was not found.",
        error: {
          code: "NOT_FOUND",
          message: "The requested record was not found.",
          details: err.meta,
        },
        requestId: reqId,
      });
    }
  }

  // Forward to Error Tracker if configured (Pre-launch Checklist Item 12)
  if (process.env.SENTRY_DSN && (err.status || err.statusCode || 500) >= 500) {
    try {
      (globalThis as any).__errorTracker?.captureException?.(err, {
        extra: { requestId: reqId, path: req.path, method: req.method },
      });
    } catch {}
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred",
    error: {
      code: err.code || (statusCode === 403 ? "FORBIDDEN" : statusCode === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
      message: err.message || "An unexpected internal server error occurred",
      details: err.details || [],
    },
    requestId: reqId,
  });
}
