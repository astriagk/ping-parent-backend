import { Router } from "express";

import { adminMgmtHandlers } from "@modules/admin/admin_management/admin_management.routes";

const router = Router();

// --- Public sub-routes (no auth) ---
router.post(
  "/auth/verify-password-hash",
  adminMgmtHandlers.public.validatePasswordHash,
  adminMgmtHandlers.public.verifyPasswordHash,
);
router.post(
  "/auth/login",
  adminMgmtHandlers.public.validateLogin,
  adminMgmtHandlers.public.login,
);
router.post(
  "/auth/setup/create-superadmin",
  adminMgmtHandlers.public.validateCreateSuperAdmin,
  adminMgmtHandlers.public.createInitialSuperAdmin,
);
router.get("/auth/verify-token", adminMgmtHandlers.public.verifyAdminToken);

export default router;
