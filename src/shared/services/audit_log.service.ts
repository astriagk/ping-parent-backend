import { WithId } from "mongodb";

import { auditLogRepository } from "@repositories/audit_log.repository";
import { UniqueCodeTypes } from "@shared/constants";
import {
  AuditLog,
  AuditLogFilters,
  AuditLogResponse,
} from "@shared/types/audit_log.type";
import { generateUniqueCode } from "@shared/utils";

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
  logData: Omit<AuditLog, "log_id" | "created_at">,
): Promise<AuditLogResponse> => {
  const auditLog: AuditLog = {
    log_id: generateUniqueCode(UniqueCodeTypes.AUDIT_LOG),
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
  const log = await auditLogRepository.findByLogId(logId);
  if (!log) {
    return null;
  }
  return formatAuditLogResponse(log);
};
