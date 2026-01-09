import { Router } from "express";

import {
  createRole,
  deleteRole,
  getAll,
  getById,
  updateRole,
} from "@modules/admin/role/role.controller";
import {
  createRoleSchema,
  updateRoleSchema,
} from "@modules/admin/role/role.validation";
import { validate, verifyAdminToken } from "@shared/middlewares";

const router = Router();

// All routes require admin authentication

// 01. Get All Roles
router.get("/", verifyAdminToken, getAll);

// 02. Create Role
router.post("/", verifyAdminToken, validate(createRoleSchema), createRole);

// Additional Routes
// Get Role by ID
router.get("/:id", verifyAdminToken, getById);

// Update Role
router.put("/:id", verifyAdminToken, validate(updateRoleSchema), updateRole);

// Delete Role
router.delete("/:id", verifyAdminToken, deleteRole);

export default router;
