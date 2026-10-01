import { z } from "zod";

export const doctorCreateSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  specialization: z.string().min(2),
  qualification: z.string().min(2),
  experienceYears: z.number().int().min(0),
  registrationNumber: z.string().min(3),
  consultationFee: z.number().positive(),
  avatar: z.string().url().optional(),
  bio: z.string().min(10),
  languages: z.array(z.string()).default(["English", "Hindi"]),
  isAvailable: z.boolean().default(true),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  videoRoomUrl: z.string().url().optional(),
  prescriptionNotes: z.string().optional(),
});

export type DoctorCreateInput = z.infer<typeof doctorCreateSchema>;
export type AppointmentStatusInput = z.infer<typeof appointmentStatusSchema>;
