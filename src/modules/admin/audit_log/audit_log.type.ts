// Table: audit_logs
export interface AuditLog {
  _id?: any; // MongoDB internal ID
  log_id: string;
  user_id?: string; // User who performed the action (if applicable)
  admin_id?: string; // Admin who performed the action (if applicable)
  action: string; // Action performed (e.g., "CREATE_USER", "UPDATE_TRIP", "DELETE_STUDENT")
  entity_type: string; // Type of entity affected (e.g., "user", "trip", "student")
  entity_id?: string; // ID of the affected entity
  ip_address?: string; // IP address of the requester
  user_agent?: string; // User agent string
  details?: Record<string, any>; // Additional details about the action
  status: "success" | "failure"; // Status of the action
  error_message?: string; // Error message if status is failure
  created_at: Date;
}

// Audit log response
export interface AuditLogResponse {
  log_id: string;
  user_id?: string;
  admin_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  status: "success" | "failure";
  error_message?: string;
  created_at: Date;
}

// Audit log query filters
export interface AuditLogFilters {
  user_id?: string;
  admin_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  status?: "success" | "failure";
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}
