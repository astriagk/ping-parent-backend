import { Router } from "express";

import { validate, verifyDriverToken } from "@shared/middlewares";
import { uploadMiddleware } from "@shared/middlewares/multer.middleware";

import {
  createDocuments,
  createProfile,
  getAddress,
  getDocuments,
  getDriverOnboardingScreen,
  getProfile,
  setAvailability,
  updateDocuments,
  updateDriverOnboardingScreen,
  updateProfile,
  upsertAddress,
} from "./driver.controller";
import {
  createDriverDocumentsSchema,
  createDriverProfileSchema,
  updateDriverDocumentsSchema,
  updateDriverOnboardingScreenSchema,
  updateDriverProfileSchema,
  upsertDriverAddressSchema,
} from "./driver.validation";

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
  uploadMiddleware.fields([
    { name: "driving_license_photo", maxCount: 1 },
    { name: "vehicle_license_photo", maxCount: 1 },
    { name: "insurance_photo", maxCount: 1 },
  ]),
  validate(createDriverDocumentsSchema),
  createDocuments,
);

// 09. Update Driver Documents
router.put(
  "/documents",
  verifyDriverToken,
  uploadMiddleware.fields([
    { name: "driving_license_photo", maxCount: 1 },
    { name: "vehicle_license_photo", maxCount: 1 },
    { name: "insurance_photo", maxCount: 1 },
  ]),
  validate(updateDriverDocumentsSchema),
  updateDocuments,
);

// 10. Get Driver Onboarding Screen
router.get("/onboarding/screen", verifyDriverToken, getDriverOnboardingScreen);

// 11. Update Driver Onboarding Screen
router.put(
  "/onboarding/screen",
  verifyDriverToken,
  validate(updateDriverOnboardingScreenSchema),
  updateDriverOnboardingScreen,
);

export default router;

/**
 * Handler group for driver module.
 * Import in src/routes/driver.routes.ts — NO auth middleware here.
 */
export const driverHandlers = {
  getProfile: getProfile,
  validateCreateProfile: validate(createDriverProfileSchema),
  createProfile: createProfile,
  validateUpdateProfile: validate(updateDriverProfileSchema),
  updateProfile: updateProfile,
  setAvailability: setAvailability,
  getAddress: getAddress,
  validateAddress: validate(upsertDriverAddressSchema),
  upsertAddress: upsertAddress,
  getDocuments: getDocuments,
  uploadDocumentsMiddleware: uploadMiddleware.fields([
    { name: "driving_license_photo", maxCount: 1 },
    { name: "vehicle_license_photo", maxCount: 1 },
    { name: "insurance_photo", maxCount: 1 },
  ]),
  validateCreateDocuments: validate(createDriverDocumentsSchema),
  createDocuments: createDocuments,
  validateUpdateDocuments: validate(updateDriverDocumentsSchema),
  updateDocuments: updateDocuments,
  getOnboardingScreen: getDriverOnboardingScreen,
  validateUpdateOnboarding: validate(updateDriverOnboardingScreenSchema),
  updateOnboardingScreen: updateDriverOnboardingScreen,
};
