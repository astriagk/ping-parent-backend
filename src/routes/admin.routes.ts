import { Router } from "express";

import {
  activateAdmin,
  activateUser,
  createAdmin,
  createInitialSuperAdmin,
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

// 01. Admin Login (Public)
router.post("/login", validate(adminLoginSchema), login);

// 02. Create Initial Super Admin (Public - No Auth Required)
// ⚠️ WARNING: This is a public endpoint for initial setup
// Use this to create super admin accounts without authentication
router.post(
  "/setup/create-superadmin",
  validate(createAdminSchema),
  createInitialSuperAdmin,
);

// Protected routes - Require admin authentication

// 03. Get All Admins
router.get("/", verifyAdminToken, getAll);

// 04. Get All Users (Admin)
router.get("/users", verifyAdminToken, getAllUsers);

// 05. Get Audit Logs (Moved to audit_logs.routes.ts)
// See /audit-logs endpoint

// Additional Admin Management Routes
// Create Admin (Requires Super Admin Auth)
router.post("/", verifyAdminToken, validate(createAdminSchema), createAdmin);

// Get Admin by ID
router.get("/:id", verifyAdminToken, getById);

// Update Admin
router.put("/:id", verifyAdminToken, validate(updateAdminSchema), updateAdmin);

// Activate Admin
router.patch("/:id/activate", verifyAdminToken, activateAdmin);

// Deactivate Admin
router.patch("/:id/deactivate", verifyAdminToken, deactivateAdmin);

// User Management Routes
// Get User by ID
router.get("/users/:id", verifyAdminToken, getUserById);

// Update User
router.put(
  "/users/:id",
  verifyAdminToken,
  validate(updateUserSchema),
  updateUser,
);

// Activate User
router.patch("/users/:id/activate", verifyAdminToken, activateUser);

// Deactivate User
router.patch("/users/:id/deactivate", verifyAdminToken, deactivateUser);

// Delete User
router.delete("/users/:id", verifyAdminToken, deleteUser);

export default router;
