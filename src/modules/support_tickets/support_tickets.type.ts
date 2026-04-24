import { TicketPriority, TicketStatus } from "@shared/constants";

export interface SupportTicket {
  _id?: any;
  user_id: string;
  subject: string;
  description: string;
  ticket_status: TicketStatus;
  priority: TicketPriority;
  assigned_to?: string; // admin_portal._id
  resolved_at?: Date;
  created_at: Date;
  updated_at?: Date;
}
