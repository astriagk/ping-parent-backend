import { validate } from "@shared/middlewares";

import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from "./role.controller";
import { createRoleSchema, updateRoleSchema } from "./role.validation";

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
