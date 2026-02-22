import { AuditAction } from "@shared/constants";

export interface AuditLog {
  _id?: any;
  user_id?: string;
  admin_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  status: AuditAction;
  error_message?: string;
  created_at: Date;
}

// Audit log response
export interface AuditLogResponse {
  _id: string;
  user_id?: string;
  admin_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  status: AuditAction;
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
  status?: AuditAction;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}
