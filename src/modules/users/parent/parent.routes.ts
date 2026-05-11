import { validate } from "@shared/middlewares";

import {
  adminBulkCreateParentsHandler,
  adminBulkParentsWithStudentsHandler,
  adminCreateParentHandler,
  adminDeleteParentHandler,
  adminGetParentAddressHandler,
  adminUpdateParentHandler,
  adminUpsertParentAddressHandler,
  getAddressParent,
  getMyActiveTripsParent,
  getMyAllTrips,
  getProfileParent,
  updateAddress,
  updateProfileParent,
} from "./parent.controller";
import {
  adminBulkCreateParentsSchema,
  adminBulkParentsWithStudentsSchema,
  adminCreateParentSchema,
  adminUpdateParentSchema,
  adminUpsertParentAddressSchema,
  updateAddressSchema,
  updateParentProfileSchema,
} from "./parent.validation";

/**
 * Handler group for parent module.
 * Import in src/routes/parent.routes.ts — NO auth middleware here.
 */
export const parentHandlers = {
  getProfile: getProfileParent,
  validateUpdate: validate(updateParentProfileSchema),
  updateProfile: updateProfileParent,
  getAddress: getAddressParent,
  validateAddress: validate(updateAddressSchema),
  updateAddress: updateAddress,
  getActiveTrips: getMyActiveTripsParent,
  getAllTrips: getMyAllTrips,

  admin: {
    validateCreate: validate(adminCreateParentSchema),
    create: adminCreateParentHandler,
    validateUpdate: validate(adminUpdateParentSchema),
    update: adminUpdateParentHandler,
    delete: adminDeleteParentHandler,
    getAddress: adminGetParentAddressHandler,
    validateAddress: validate(adminUpsertParentAddressSchema),
    upsertAddress: adminUpsertParentAddressHandler,
    validateBulkParents: validate(adminBulkCreateParentsSchema),
    bulkCreateParents: adminBulkCreateParentsHandler,
    validateBulkParentsWithStudents: validate(
      adminBulkParentsWithStudentsSchema,
    ),
    bulkCreateParentsWithStudents: adminBulkParentsWithStudentsHandler,
  },
};
