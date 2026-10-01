import { z } from "zod";

export const prescriptionApproveSchema = z.object({
  validityDate: z.string().datetime("Validity date is required"),
  notes: z.string().optional(),
});

export const prescriptionRejectSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
  rejectionTemplateSlug: z.string().optional(),
  notes: z.string().optional(),
});

export const prescriptionAssignSchema = z.object({
  pharmacistId: z.string().uuid("Pharmacist user ID is required"),
});

export type PrescriptionApproveInput = z.infer<typeof prescriptionApproveSchema>;
export type PrescriptionRejectInput = z.infer<typeof prescriptionRejectSchema>;
export type PrescriptionAssignInput = z.infer<typeof prescriptionAssignSchema>;
