import { Router } from "express";

import { verifyAdminToken } from "@shared/middlewares";

import { getAuditLogById, getAuditLogs } from "./audit_log.controller";

const router = Router();

// All audit log routes require admin authentication

// 01. Get Audit Logs
router.get("/", verifyAdminToken, getAuditLogs);

// Additional Routes
// Get Audit Log by ID
router.get("/:id", verifyAdminToken, getAuditLogById);

export default router;

/**
 * Handler group for audit_log module.
 * Import in src/routes/admin.routes.ts, superadmin.routes.ts — NO auth middleware here.
 */
export const auditLogHandlers = {
  getAll: getAuditLogs,
  getById: getAuditLogById,
};
