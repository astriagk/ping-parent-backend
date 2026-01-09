import { Router } from "express";

import {
  createDocuments,
  createProfile,
  getAddress,
  getDocuments,
  getProfile,
  setAvailability,
  updateDocuments,
  updateProfile,
  upsertAddress,
} from "@controllers/driver.controller";
import { validate, verifyDriverToken } from "@shared/middlewares";
import {
  createDriverDocumentsSchema,
  createDriverProfileSchema,
  updateDriverDocumentsSchema,
  updateDriverProfileSchema,
  upsertDriverAddressSchema,
} from "@validations/driver.validation";

const router = Router();

// 01. Get Driver Profile
router.get("/profile", verifyDriverToken, getProfile);

// 02. Create Driver Profile
router.post(
  "/profile",
  verifyDriverToken,
  validate(createDriverProfileSchema),
  createProfile,
);

// 03. Update Driver Profile
router.put(
  "/profile",
  verifyDriverToken,
  validate(updateDriverProfileSchema),
  updateProfile,
);

// 04. Set Driver Availability
router.patch("/availability", verifyDriverToken, setAvailability);

// 05. Get Driver Address
router.get("/address", verifyDriverToken, getAddress);

// 06. Create/Update Driver Address
router.post(
  "/address",
  verifyDriverToken,
  validate(upsertDriverAddressSchema),
  upsertAddress,
);

// 07. Get Driver Documents
router.get("/documents", verifyDriverToken, getDocuments);

// 08. Upload Driver Documents
router.post(
  "/documents",
  verifyDriverToken,
  validate(createDriverDocumentsSchema),
  createDocuments,
);

// 09. Update Driver Documents
router.put(
  "/documents",
  verifyDriverToken,
  validate(updateDriverDocumentsSchema),
  updateDocuments,
);

export default router;
