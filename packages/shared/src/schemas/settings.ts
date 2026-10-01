import { z } from "zod";

export const storeSettingsSchema = z.object({
  storeName: z.string().min(2).default("Pharmico Medical Store"),
  storeLogo: z.string().url().optional(),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format"),
  drugLicenceNo: z.string().min(5, "Drug Licence Number is required"),
  contactPhone: z.string().min(10),
  contactEmail: z.string().email(),
  deliveryCharge: z.number().min(0).default(50),
  freeShippingThreshold: z.number().min(0).default(500),
  isCodEnabled: z.boolean().default(true),
  codOrderLimit: z.number().positive().default(2000),
  isMaintenanceMode: z.boolean().default(false),
  serviceablePincodes: z.array(z.string()).default([]),
  deliverySlots: z.array(z.string()).default([
    "08:00 AM - 12:00 PM",
    "12:00 PM - 04:00 PM",
    "04:00 PM - 08:00 PM",
  ]),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
