import { Router } from "express";

import { adminMgmtHandlers } from "@modules/admin/admin_management/admin_management.routes";

const router = Router();

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

export default router;
