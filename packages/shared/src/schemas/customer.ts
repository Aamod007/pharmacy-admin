import { z } from "zod";

export const customerUpdateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  isActive: z.boolean(),
});

export const customerBlockToggleSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional(),
});

export const customerInternalNoteSchema = z.object({
  note: z.string().min(2),
});

export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerBlockToggleInput = z.infer<typeof customerBlockToggleSchema>;
