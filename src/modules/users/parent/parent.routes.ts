import { validate } from "@shared/middlewares";

import {
  getAddressParent,
  getMyActiveTripsParent,
  getMyAllTrips,
  getProfileParent,
  updateAddress,
  updateProfileParent,
} from "./parent.controller";
import {
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
};
