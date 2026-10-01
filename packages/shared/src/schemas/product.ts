import { z } from "zod";
import { ScheduleType } from "../enums";

export const productOverviewSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(250),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  shortDescription: z.string().max(300, "Short description cannot exceed 300 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description maximum 2000 characters"),
  brandId: z.string().uuid("Please select a valid brand"),
  categoryId: z.string().uuid("Please select a valid category"),
  tags: z.array(z.string()).default([]),
  prescriptionRequired: z.boolean().default(false),
  scheduleType: z.nativeEnum(ScheduleType).default(ScheduleType.OTC),
  manufacturer: z.string().min(2, "Manufacturer name is required"),
  countryOfOrigin: z.string().default("India"),
  images: z.array(z.string().min(1, "Product image cannot be empty")).min(1, "At least 1 product image is required"),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
});

export const productDetailsSchema = z.object({
  composition: z.string().min(2, "Active salt/composition is required (e.g. Paracetamol 500mg)"),
  uses: z.string().min(5, "Therapeutic uses/indications are required"),
  sideEffects: z.string().optional(),
  dosage: z.string().optional(),
  storageInstructions: z.string().default("Store in a cool and dry place below 25°C. Protect from light."),
  warnings: z.string().optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().min(3),
        answer: z.string().min(3),
      })
    )
    .default([]),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).default([]),
});

export const productVariantPriceSchema = z.object({
  name: z.string().min(1, "Pack name is required (e.g. Strip of 10 Tablets)"),
  packSize: z.string().min(1, "Pack size is required (e.g. 10 Tablets)"),
  sku: z.string().min(3, "SKU is required"),
  mrp: z.number().positive("MRP must be greater than 0"),
  price: z.number().positive("Selling price must be greater than 0"),
  discountPercent: z.number().min(0).max(100).default(0),
  gstRate: z.number().min(0).max(28).default(12),
  hsnCode: z.string().default("300490"),
  weightGrams: z.number().int().positive().default(100),
  isDefault: z.boolean().default(false),
});

export const productPricingSchema = z.object({
  gstRate: z.number().min(0).max(28).default(12),
  hsnCode: z.string().default("300490"),
  isTaxInclusive: z.boolean().default(true),
  variants: z.array(productVariantPriceSchema).min(1, "At least one product variant is required"),
});

export const inventoryBatchRowSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  mfgDate: z.string().datetime("MFG Date must be ISO format"),
  expiryDate: z.string().datetime("Expiry Date must be ISO format"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  costPrice: z.number().positive("Cost price must be greater than 0"),
});

export const productInventorySchema = z.object({
  lowStockThreshold: z.number().int().min(1).default(10),
  maxOrderQuantity: z.number().int().min(1).default(10),
  initialBatches: z.record(z.string(), z.array(inventoryBatchRowSchema)).optional(), // Map of variantId/sku -> batches
});

export const fullProductWizardSchema = productOverviewSchema
  .merge(productDetailsSchema)
  .merge(productPricingSchema)
  .merge(productInventorySchema)
  .extend({
    status: z.enum(["PUBLISHED", "DRAFT"]).default("PUBLISHED"),
  });

export const productCsvRowSchema = z.object({
  name: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  brandSlug: z.string(),
  sku: z.string(),
  packSize: z.string(),
  mrp: z.coerce.number(),
  price: z.coerce.number(),
  gstRate: z.coerce.number().default(12),
  hsnCode: z.string().default("300490"),
  composition: z.string(),
  uses: z.string(),
  manufacturer: z.string(),
  prescriptionRequired: z.coerce.boolean().default(false),
  scheduleType: z.string().default("OTC"),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  stockQty: z.coerce.number().int().default(0),
});

export type ProductOverviewInput = z.infer<typeof productOverviewSchema>;
export type ProductDetailsInput = z.infer<typeof productDetailsSchema>;
export type ProductPricingInput = z.infer<typeof productPricingSchema>;
export type ProductInventoryInput = z.infer<typeof productInventorySchema>;
export type FullProductWizardInput = z.infer<typeof fullProductWizardSchema>;
export type ProductCsvRow = z.infer<typeof productCsvRowSchema>;
