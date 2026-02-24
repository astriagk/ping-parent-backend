import { Router } from "express";

import { verifyAdminToken } from "@shared/middlewares";

import { getAuditLogById, getAuditLogs } from "./audit_log.controller";

/**
 * Handler group for audit_log module.
 * Import in src/routes/admin.routes.ts, superadmin.routes.ts — NO auth middleware here.
 */
export const auditLogHandlers = {
  getAll: getAuditLogs,
  getById: getAuditLogById,
};
