import { updateUserSchema } from "@modules/auth/auth.validation";
import { validate } from "@shared/middlewares";

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
