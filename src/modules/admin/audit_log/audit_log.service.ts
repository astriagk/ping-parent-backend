import { WithId } from "mongodb";

import { auditLogRepository } from "./audit_log.repository";
import { AuditLog, AuditLogFilters, AuditLogResponse } from "./audit_log.type";

/**
 * Format audit log response
 */
const formatAuditLogResponse = (log: WithId<AuditLog>): AuditLogResponse => {
  const { _id, ...logData } = log;
  return logData as AuditLogResponse;
};

/**
 * Create a new audit log entry
 */
export const createAuditLog = async (
  logData: Omit<AuditLog, "created_at">,
): Promise<AuditLogResponse> => {
  const auditLog: AuditLog = {
    ...logData,
    created_at: new Date(),
  };

  const newLog = await auditLogRepository.create(auditLog);
  return formatAuditLogResponse(newLog);
};

/**
 * Get audit logs by filters
 */
export const getAuditLogs = async (
  filters: AuditLogFilters,
): Promise<{ logs: AuditLogResponse[]; total: number }> => {
  const logs = await auditLogRepository.findByFilters(filters);
  const total = await auditLogRepository.countByFilters(filters);

  return {
    logs: logs.map(formatAuditLogResponse),
    total,
  };
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (
  logId: string,
): Promise<AuditLogResponse | null> => {
  const log = await auditLogRepository.findById(logId);
  if (!log) {
    return null;
  }
  return formatAuditLogResponse(log);
};
