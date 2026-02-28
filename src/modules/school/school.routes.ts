import { validate } from "@shared/middlewares";

import {
  createSchool,
  deleteSchool,
  getAllSchools,
  getSchool,
  updateSchool,
} from "./school.controller";
import { createSchoolSchema, updateSchoolSchema } from "./school.validation";

/**
 * Handler group for school module.
 * Import in src/routes/shared.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const schoolHandlers = {
  // Shared (any authenticated user — read-only)
  shared: {
    getAll: getAllSchools,
    getById: getSchool,
  },

  // Admin-specific
  admin: {
    validateCreate: validate(createSchoolSchema),
    create: createSchool,
    validateUpdate: validate(updateSchoolSchema),
    update: updateSchool,
    delete: deleteSchool,
  },
};
