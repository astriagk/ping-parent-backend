import { Router } from "express";

import { adminMgmtHandlers } from "@modules/admin/admin_management/admin_management.routes";
import { auditLogHandlers } from "@modules/admin/audit_log/audit_log.routes";
import { roleHandlers } from "@modules/admin/role/role.routes";
import { verifySuperadminToken } from "@shared/middlewares";

const router = Router();

/**
 * SUPERADMIN GATEWAY — superadmin only
 * Platform-level operations: admin account management, role management, full audit logs
 */
router.use(verifySuperadminToken);

// --- Admin Account Management ---
router.get("/admins", adminMgmtHandlers.superadmin.getAll);
router.post(
  "/admins",
  adminMgmtHandlers.superadmin.validateCreate,
  adminMgmtHandlers.superadmin.create,
);
router.get("/admins/:id", adminMgmtHandlers.superadmin.getById);
router.put(
  "/admins/:id",
  adminMgmtHandlers.superadmin.validateUpdate,
  adminMgmtHandlers.superadmin.update,
);
router.patch("/admins/:id/activate", adminMgmtHandlers.superadmin.activate);
router.patch("/admins/:id/deactivate", adminMgmtHandlers.superadmin.deactivate);

// --- Admin Management by admin_id (for frontend — no _id exposure) ---
router.get(
  "/admins/by-admin-id/:admin_id",
  adminMgmtHandlers.superadmin.getByAdminId,
);
router.put(
  "/admins/by-admin-id/:admin_id",
  adminMgmtHandlers.superadmin.validateUpdate,
  adminMgmtHandlers.superadmin.updateByAdminId,
);
router.patch(
  "/admins/by-admin-id/:admin_id/activate",
  adminMgmtHandlers.superadmin.activateByAdminId,
);
router.patch(
  "/admins/by-admin-id/:admin_id/deactivate",
  adminMgmtHandlers.superadmin.deactivateByAdminId,
);

// --- Role Management ---
router.get("/roles", roleHandlers.getAll);
router.post("/roles", roleHandlers.validateCreate, roleHandlers.create);
router.get("/roles/:id", roleHandlers.getById);
router.put("/roles/:id", roleHandlers.validateUpdate, roleHandlers.update);
router.delete("/roles/:id", roleHandlers.delete);

// --- Full Audit Logs (including admin-level actions) ---
router.get("/audit-logs", auditLogHandlers.getAll);
router.get("/audit-logs/:id", auditLogHandlers.getById);

export default router;
