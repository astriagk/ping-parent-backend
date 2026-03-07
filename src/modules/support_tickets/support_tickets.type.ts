export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

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
