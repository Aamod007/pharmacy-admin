import { z } from "zod";

export const brandCreateSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  logo: z.string().url("Must be a valid URL").optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const brandUpdateSchema = brandCreateSchema.partial();

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
