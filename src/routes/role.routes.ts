import { Router } from "express";

import {
  createRole,
  deleteRole,
  getAll,
  getById,
  updateRole,
} from "@controllers/role.controller";
import { validate, verifyAdminToken } from "@middlewares";
import {
  createRoleSchema,
  updateRoleSchema,
} from "@validations/role.validation";

const router = Router();

// All routes require admin authentication
router.post("/", verifyAdminToken, validate(createRoleSchema), createRole);
router.get("/", verifyAdminToken, getAll);
router.get("/:id", verifyAdminToken, getById);
router.put("/:id", verifyAdminToken, validate(updateRoleSchema), updateRole);
router.delete("/:id", verifyAdminToken, deleteRole);

export default router;
