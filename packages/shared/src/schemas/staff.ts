import { z } from "zod";

export const staffInviteSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10).optional(),
  roleId: z.string().uuid("Select a valid role"),
});

export const staffUpdateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roleId: z.string().uuid(),
  isActive: z.boolean(),
});

export const roleCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[A-Z0-9_]+$/),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).min(1, "At least one permission is required"),
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
