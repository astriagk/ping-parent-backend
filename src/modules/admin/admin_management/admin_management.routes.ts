import { Router } from "express";

import { updateUserSchema } from "@modules/auth/auth.validation";
import { validate, verifyAdminToken } from "@shared/middlewares";

import {
  activateAdmin,
  activateAdminByAdminId,
  activateUser,
  createAdmin,
  createInitialSuperAdmin,
  deactivateAdmin,
  deactivateAdminByAdminId,
  deactivateUser,
  deleteUser,
  getAdminsBySchool,
  getAll,
  getAllUsers,
  getByAdminId,
  getById,
  getDriverCompleteDetails,
  getParentCompleteDetails,
  getUserById,
  login,
  updateAdmin,
  updateAdminByAdminId,
  updateDriverApprovalStatus,
  updateUser,
  verifyAdminAuthToken,
  verifyPasswordHash,
} from "./admin_management.controller";
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
  verifyPasswordHashSchema,
} from "./admin_management.validation";

const router = Router();

// 00. Verify Password Hash (Public - for debugging/testing)
router.post(
  "/verify-password-hash",
  validate(verifyPasswordHashSchema),
  verifyPasswordHash,
);

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

router.get("/verify-admin-token", verifyAdminAuthToken);

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

// Get all admins for a school
router.get("/by-school/:school_id", verifyAdminToken, getAdminsBySchool);

// Admin Management Routes by admin_id (for frontend use - no _id exposure)
// Get Admin by admin_id
router.get("/by-admin-id/:admin_id", verifyAdminToken, getByAdminId);

// Update Admin by admin_id
router.put(
  "/by-admin-id/:admin_id",
  verifyAdminToken,
  validate(updateAdminSchema),
  updateAdminByAdminId,
);

// Activate Admin by admin_id
router.patch(
  "/by-admin-id/:admin_id/activate",
  verifyAdminToken,
  activateAdminByAdminId,
);

// Deactivate Admin by admin_id
router.patch(
  "/by-admin-id/:admin_id/deactivate",
  verifyAdminToken,
  deactivateAdminByAdminId,
);

// Get complete driver details by ID (for admin verification)
router.get("/drivers/:id/details", verifyAdminToken, getDriverCompleteDetails);

// Get complete parent details by ID (for admin verification)
router.get("/parents/:id/details", verifyAdminToken, getParentCompleteDetails);

// Update driver approval status
router.patch(
  "/drivers/:id/approval-status",
  verifyAdminToken,
  updateDriverApprovalStatus,
);

export default router;

/**
 * Handler group for admin_management module.
 * Import in src/routes/admin.routes.ts, superadmin.routes.ts — NO auth middleware here.
 */
export const adminMgmtHandlers = {
  // Public (no auth — login & setup)
  public: {
    validatePasswordHash: validate(verifyPasswordHashSchema),
    verifyPasswordHash: verifyPasswordHash,
    validateLogin: validate(adminLoginSchema),
    login: login,
    validateCreateSuperAdmin: validate(createAdminSchema),
    createInitialSuperAdmin: createInitialSuperAdmin,
    verifyAdminToken: verifyAdminAuthToken,
  },

  // Admin + superadmin shared
  admin: {
    getAllUsers: getAllUsers,
    getUserById: getUserById,
    validateUpdateUser: validate(updateUserSchema),
    updateUser: updateUser,
    activateUser: activateUser,
    deactivateUser: deactivateUser,
    deleteUser: deleteUser,
    getDriverDetails: getDriverCompleteDetails,
    getParentDetails: getParentCompleteDetails,
    updateDriverApproval: updateDriverApprovalStatus,
    getAdminsBySchool: getAdminsBySchool,
  },

  // Superadmin-only
  superadmin: {
    getAll: getAll,
    validateCreate: validate(createAdminSchema),
    create: createAdmin,
    getById: getById,
    validateUpdate: validate(updateAdminSchema),
    update: updateAdmin,
    activate: activateAdmin,
    deactivate: deactivateAdmin,
    getByAdminId: getByAdminId,
    updateByAdminId: updateAdminByAdminId,
    activateByAdminId: activateAdminByAdminId,
    deactivateByAdminId: deactivateAdminByAdminId,
  },
};
