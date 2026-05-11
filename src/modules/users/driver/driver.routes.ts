import { validate } from "@shared/middlewares";
import { uploadMiddleware } from "@shared/middlewares/multer.middleware";

import {
  adminCreateDriverHandler,
  adminDeleteDriverHandler,
  adminGetDriverAddressHandler,
  adminGetDriverDocumentsHandler,
  adminUpdateDriverDocumentsHandler,
  adminUpdateDriverHandler,
  adminUpsertDriverAddressHandler,
  adminUpsertDriverDocumentsHandler,
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
  adminCreateDriverSchema,
  adminUpdateDriverDocumentsSchema,
  adminUpdateDriverSchema,
  adminUpsertDriverAddressSchema,
  adminUpsertDriverDocumentsSchema,
  createDriverDocumentsSchema,
  createDriverProfileSchema,
  updateDriverDocumentsSchema,
  updateDriverOnboardingScreenSchema,
  updateDriverProfileSchema,
  upsertDriverAddressSchema,
} from "./driver.validation";

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

  admin: {
    validateCreate: validate(adminCreateDriverSchema),
    create: adminCreateDriverHandler,
    validateUpdate: validate(adminUpdateDriverSchema),
    update: adminUpdateDriverHandler,
    delete: adminDeleteDriverHandler,
    getAddress: adminGetDriverAddressHandler,
    validateAddress: validate(adminUpsertDriverAddressSchema),
    upsertAddress: adminUpsertDriverAddressHandler,
    getDocuments: adminGetDriverDocumentsHandler,
    validateUpsertDocuments: validate(adminUpsertDriverDocumentsSchema),
    upsertDocuments: adminUpsertDriverDocumentsHandler,
    validateUpdateDocuments: validate(adminUpdateDriverDocumentsSchema),
    updateDocuments: adminUpdateDriverDocumentsHandler,
  },
};
