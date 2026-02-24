import { Router } from "express";

import { validate, verifyAdminToken } from "@shared/middlewares";

import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from "./role.controller";
import { createRoleSchema, updateRoleSchema } from "./role.validation";

const router = Router();

// All routes require admin authentication

// 01. Get All Roles
router.get("/", verifyAdminToken, getAllRoles);

// 02. Create Role
router.post("/", verifyAdminToken, validate(createRoleSchema), createRole);

// Additional Routes
// Get Role by ID
router.get("/:id", verifyAdminToken, getRoleById);

// Update Role
router.put("/:id", verifyAdminToken, validate(updateRoleSchema), updateRole);

// Delete Role
router.delete("/:id", verifyAdminToken, deleteRole);

export default router;

/**
 * Handler group for role module.
 * Import in src/routes/superadmin.routes.ts — NO auth middleware here.
 */
export const roleHandlers = {
  getAll: getAllRoles,
  validateCreate: validate(createRoleSchema),
  create: createRole,
  getById: getRoleById,
  validateUpdate: validate(updateRoleSchema),
  update: updateRole,
  delete: deleteRole,
};
