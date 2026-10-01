import { z } from "zod";
import { DiscountType } from "../enums";

export const couponCreateSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code must be uppercase alphanumeric"),
  description: z.string().min(5, "Description is required"),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().default(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export const couponUpdateSchema = couponCreateSchema.partial();

export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;
