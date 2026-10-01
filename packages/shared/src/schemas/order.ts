import { z } from "zod";
import { OrderStatus, PaymentStatus } from "../enums";

export const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

export const orderInternalCommentSchema = z.object({
  note: z.string().min(2, "Comment must be at least 2 characters").max(1000),
});

export const batchAllocationItemSchema = z.object({
  orderItemId: z.string().uuid(),
  batchId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const orderBatchAllocationSchema = z.object({
  allocations: z.array(batchAllocationItemSchema).min(1),
});

export const orderFilterSchema = z.object({
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(20),
  search: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hasPrescription: z.coerce.boolean().optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).optional(),
  pincode: z.string().optional(),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type OrderInternalCommentInput = z.infer<typeof orderInternalCommentSchema>;
export type OrderBatchAllocationInput = z.infer<typeof orderBatchAllocationSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
