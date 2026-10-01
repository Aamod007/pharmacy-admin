import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("🚨 Admin API Error:", err);

  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      return res.status(409).json({
        success: false,
        message: `A record with this ${target} already exists.`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "The requested record was not found.",
      });
    }
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred",
  });
}
