import { Router } from "express";

import {
  getAuditLogById,
  getAuditLogs,
} from "@controllers/audit_log.controller";
import { verifyAdminToken } from "@middlewares";

const router = Router();

// All audit log routes require admin authentication
router.get("/", verifyAdminToken, getAuditLogs);
router.get("/:id", verifyAdminToken, getAuditLogById);

export default router;
