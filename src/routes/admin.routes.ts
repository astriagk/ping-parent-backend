import { Router } from "express";

import {
  activateAdmin,
  createAdmin,
  deactivateAdmin,
  getAll,
  getById,
  login,
  updateAdmin,
} from "@controllers/admin.controller";
import { validate, verifyAdminToken } from "@middlewares";
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
} from "@validations/admin.validation";

const router = Router();

// Public route - Admin login
router.post("/login", validate(adminLoginSchema), login);

// Protected routes - Require admin authentication
router.post("/", verifyAdminToken, validate(createAdminSchema), createAdmin);
router.get("/", verifyAdminToken, getAll);
router.get("/:id", verifyAdminToken, getById);
router.put("/:id", verifyAdminToken, validate(updateAdminSchema), updateAdmin);
router.patch("/:id/activate", verifyAdminToken, activateAdmin);
router.patch("/:id/deactivate", verifyAdminToken, deactivateAdmin);

export default router;
