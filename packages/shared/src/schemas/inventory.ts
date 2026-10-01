import { z } from "zod";
import { AdminStockMovementType } from "../enums";

export const batchCreateSchema = z.object({
  variantId: z.string().uuid("Valid product variant ID is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  mfgDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  quantity: z.number().int().positive("Initial quantity must be greater than 0"),
  costPrice: z.number().positive("Cost price must be positive"),
  isBlocked: z.boolean().default(false),
});

export const stockAdjustmentSchema = z.object({
  batchId: z.string().uuid("Batch ID is required"),
  variantId: z.string().uuid("Variant ID is required"),
  type: z.nativeEnum(AdminStockMovementType),
  quantity: z.number().int().refine((val) => val !== 0, "Adjustment quantity cannot be zero"),
  reason: z.string().min(3, "Reason for stock adjustment is required"),
});

export const fefoQuerySchema = z.object({
  variantId: z.string().uuid().optional(),
  expiryDays: z.enum(["30", "60", "90", "all"]).default("all"),
  isBlocked: z.boolean().optional(),
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(20),
});

export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type FefoQueryInput = z.infer<typeof fefoQuerySchema>;
