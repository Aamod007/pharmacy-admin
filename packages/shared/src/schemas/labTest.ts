import { z } from "zod";

export const labTestCreateSchema = z.object({
  name: z.string().min(3, "Test name is required"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  category: z.string().min(2),
  price: z.number().positive(),
  mrp: z.number().positive(),
  sampleType: z.string().min(2),
  fastingRequired: z.boolean().default(false),
  reportTimeHours: z.number().int().positive().default(24),
  testParameters: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const labBookingReportUploadSchema = z.object({
  reportUrl: z.string().url("Valid report URL is required"),
  status: z.enum(["SAMPLE_COLLECTED", "PROCESSING", "COMPLETED"]).default("COMPLETED"),
});

export type LabTestCreateInput = z.infer<typeof labTestCreateSchema>;
export type LabBookingReportUploadInput = z.infer<typeof labBookingReportUploadSchema>;
