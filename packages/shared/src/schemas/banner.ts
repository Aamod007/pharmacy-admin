import { z } from "zod";

export const bannerCreateSchema = z.object({
  title: z.string().min(2, "Banner title is required"),
  subtitle: z.string().optional(),
  imageUrl: z.string().url("Valid image URL is required"),
  targetUrl: z.string().default("/products"),
  buttonText: z.string().default("Shop Now"),
  position: z.enum(["HERO", "PROMO_LEFT", "PROMO_MID", "PROMO_RIGHT"]).default("HERO"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const bannerUpdateSchema = bannerCreateSchema.partial();

export type BannerCreateInput = z.infer<typeof bannerCreateSchema>;
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>;
