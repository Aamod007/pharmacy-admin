import { z } from "zod";
import { AdminTicketPriority, AdminTicketStatus } from "../enums";

export const supportTicketReplySchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(1, "Message cannot be empty"),
  isInternalNote: z.boolean().default(false),
  attachments: z.array(z.string().url()).default([]),
});

export const supportTicketStatusUpdateSchema = z.object({
  status: z.nativeEnum(AdminTicketStatus).optional(),
  priority: z.nativeEnum(AdminTicketPriority).optional(),
  assignedToAdminId: z.string().uuid().optional().nullable(),
});

export type SupportTicketReplyInput = z.infer<typeof supportTicketReplySchema>;
export type SupportTicketStatusUpdateInput = z.infer<typeof supportTicketStatusUpdateSchema>;
