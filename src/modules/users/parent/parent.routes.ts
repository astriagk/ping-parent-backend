import { Router } from "express";

import { validate, verifyParentToken } from "@shared/middlewares";

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

const router = Router();

// 01. Get Parent Profile
router.get("/profile", verifyParentToken, getProfileParent);

// 02. Update Parent Profile
router.put(
  "/profile",
  verifyParentToken,
  validate(updateParentProfileSchema),
  updateProfileParent,
);

// 03. Get Parent Address
router.get("/address", verifyParentToken, getAddressParent);

// 04. Update Parent Address
router.put(
  "/address",
  verifyParentToken,
  validate(updateAddressSchema),
  updateAddress,
);

// 05. Get Active Trips for Parent's Children
router.get("/trips/active", verifyParentToken, getMyActiveTripsParent);

// 06. Get All Trips for Parent's Children
router.get("/trips", verifyParentToken, getMyAllTrips);

export default router;
