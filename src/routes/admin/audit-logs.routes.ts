import { Router } from "express";

import { auditLogHandlers } from "@modules/admin/audit_log/audit_log.routes";

const router = Router();

// --- Audit Logs ---
router.get("/audit-logs", auditLogHandlers.getAll);
router.get("/audit-logs/:id", auditLogHandlers.getById);

export default router;
