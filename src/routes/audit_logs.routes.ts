import { Router } from "express";

import {
  getAuditLogById,
  getAuditLogs,
} from "@controllers/audit_log.controller";
import { verifyAdminToken } from "@middlewares";

const router = Router();

// All audit log routes require admin authentication

// 01. Get Audit Logs
router.get("/", verifyAdminToken, getAuditLogs);

// Additional Routes
// Get Audit Log by ID
router.get("/:id", verifyAdminToken, getAuditLogById);

export default router;
