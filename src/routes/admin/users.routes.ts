import { Router } from "express";

import { adminMgmtHandlers } from "@modules/admin/admin_management/admin_management.routes";
import { authHandlers } from "@modules/auth/auth.routes";

const router = Router();

// --- Users (from auth module) ---
router.get("/users", authHandlers.admin.getAllUsers);
router.patch("/users/:id/activate", authHandlers.admin.activateUser);
router.patch("/users/:id/deactivate", authHandlers.admin.deactivateUser);

// --- User Management (from admin_management module) ---
router.get("/management/users", adminMgmtHandlers.admin.getAllUsers);
router.get("/management/users/:id", adminMgmtHandlers.admin.getUserById);
router.put(
  "/management/users/:id",
  adminMgmtHandlers.admin.validateUpdateUser,
  adminMgmtHandlers.admin.updateUser,
);
router.patch(
  "/management/users/:id/activate",
  adminMgmtHandlers.admin.activateUser,
);
router.patch(
  "/management/users/:id/deactivate",
  adminMgmtHandlers.admin.deactivateUser,
);
router.delete("/management/users/:id", adminMgmtHandlers.admin.deleteUser);
router.get(
  "/management/drivers/:id/details",
  adminMgmtHandlers.admin.getDriverDetails,
);
router.get(
  "/management/parents/:id/details",
  adminMgmtHandlers.admin.getParentDetails,
);
router.patch(
  "/management/drivers/:id/approval-status",
  adminMgmtHandlers.admin.updateDriverApproval,
);
router.get(
  "/management/by-school/:school_id",
  adminMgmtHandlers.admin.getAdminsBySchool,
);

export default router;
