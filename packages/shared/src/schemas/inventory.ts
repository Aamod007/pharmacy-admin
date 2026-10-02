import { z } from "zod";
import { AdminStockMovementType, AdminPurchaseStatus } from "../enums";

export const batchCreateSchema = z.object({
  variantId: z.string().uuid("Valid product variant ID is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  mfgDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  costPrice: z.coerce.number().positive("Cost price must be positive"),
  isBlocked: z.boolean().default(false),
}).refine((data) => data.expiryDate > data.mfgDate, {
  message: "Expiry date must be later than manufacturing date",
  path: ["expiryDate"],
});

export const batchUpdateSchema = z.object({
  batchNumber: z.string().min(1).optional(),
  expiryDate: z.coerce.date().optional(),
  costPrice: z.coerce.number().positive().optional(),
  isBlocked: z.boolean().optional(),
  reason: z.string().min(3, "Reason for modification is required"),
});

export const batchWriteOffSchema = z.object({
  reason: z.string().min(3, "Reason for write-off is required"),
});

export const purchaseItemSchema = z.object({
  variantId: z.string().uuid("Valid variant ID is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  mfgDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  quantity: z.coerce.number().int().positive("Received quantity must be greater than 0"),
  costPrice: z.coerce.number().positive("Unit purchase cost must be positive"),
});

export const purchaseEntryCreateSchema = z.object({
  supplierId: z.string().uuid("Supplier ID is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.coerce.date(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required in a purchase entry"),
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
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
export type BatchWriteOffInput = z.infer<typeof batchWriteOffSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type PurchaseEntryCreateInput = z.infer<typeof purchaseEntryCreateSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type FefoQueryInput = z.infer<typeof fefoQuerySchema>;
