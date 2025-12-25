// Table: ratings_reviews
export interface RatingReview {
  _id?: any; // MongoDB internal ID
  review_id?: string;
  parent_id: string;
  driver_id: string;
  trip_id?: string;
  rating: number; // 1-5 stars
  review_text?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Table: support_tickets
export interface SupportTicket {
  _id?: any; // MongoDB internal ID
  ticket_id?: string;
  user_id: string;
  subject: string;
  description: string;
  ticket_status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  created_at?: Date;
  updated_at?: Date;
  resolved_at?: Date;
}

// Table: audit_logs
export interface AuditLog {
  _id?: any; // MongoDB internal ID
  log_id?: string;
  user_id?: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any; // JSON field
  new_values?: any; // JSON field
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
}
