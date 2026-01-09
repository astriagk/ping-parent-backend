import { Router } from "express";

import {
  getAddress,
  getProfile,
  updateAddress,
  updateProfile,
} from "@modules/users/parent/parent.controller";
import {
  updateAddressSchema,
  updateParentProfileSchema,
} from "@modules/users/parent/parent.validation";
import { validate, verifyParentToken } from "@shared/middlewares";

const router = Router();

// 01. Get Parent Profile
router.get("/profile", verifyParentToken, getProfile);

// 02. Update Parent Profile
router.put(
  "/profile",
  verifyParentToken,
  validate(updateParentProfileSchema),
  updateProfile,
);

// 03. Get Parent Address
router.get("/address", verifyParentToken, getAddress);

// 04. Update Parent Address
router.put(
  "/address",
  verifyParentToken,
  validate(updateAddressSchema),
  updateAddress,
);

export default router;
