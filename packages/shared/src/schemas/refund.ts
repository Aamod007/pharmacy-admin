import { z } from "zod";

export const refundCreateSchema = z.object({
  orderId: z.string().uuid("Order ID is required"),
  paymentId: z.string().uuid("Payment ID is required"),
  amount: z.number().positive("Refund amount must be positive"),
  reason: z.string().min(5, "Refund reason is required"),
  generateCreditNote: z.boolean().default(true),
});

export type RefundCreateInput = z.infer<typeof refundCreateSchema>;
