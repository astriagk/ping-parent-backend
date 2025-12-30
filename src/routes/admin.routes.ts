import { Router } from "express";

import {
  activateAdmin,
  activateUser,
  createAdmin,
  deactivateAdmin,
  deactivateUser,
  deleteUser,
  getAll,
  getAllUsers,
  getById,
  getUserById,
  login,
  updateAdmin,
  updateUser,
} from "@controllers/admin.controller";
import { validate, verifyAdminToken } from "@middlewares";
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
} from "@validations/admin.validation";
import { updateUserSchema } from "@validations/auth.validation";

const router = Router();

// Public route - Admin login
router.post("/login", validate(adminLoginSchema), login);

// Protected routes - Require admin authentication

// Admin management routes
router.post("/", verifyAdminToken, validate(createAdminSchema), createAdmin);
router.get("/", verifyAdminToken, getAll);
router.get("/:id", verifyAdminToken, getById);
router.put("/:id", verifyAdminToken, validate(updateAdminSchema), updateAdmin);
router.patch("/:id/activate", verifyAdminToken, activateAdmin);
router.patch("/:id/deactivate", verifyAdminToken, deactivateAdmin);

// User management routes
router.get("/users", verifyAdminToken, getAllUsers);
router.get("/users/:id", verifyAdminToken, getUserById);
router.put(
  "/users/:id",
  verifyAdminToken,
  validate(updateUserSchema),
  updateUser,
);
router.patch("/users/:id/activate", verifyAdminToken, activateUser);
router.patch("/users/:id/deactivate", verifyAdminToken, deactivateUser);
router.delete("/users/:id", verifyAdminToken, deleteUser);

export default router;
