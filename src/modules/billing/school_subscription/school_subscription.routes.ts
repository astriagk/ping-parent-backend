import { Router } from "express";

import { validate, verifyAdminToken } from "@shared/middlewares";

import {
  cancelSchoolSubscription,
  createSchoolSubscription,
  generateStudentCodes,
  getActiveSchoolSubscription,
  getCodesBySchoolSubscription,
  getExpiredSubscriptions,
  getSchoolSubscriptionById,
  getSchoolSubscriptions,
  renewSchoolSubscription,
  updateSchoolSubscription,
} from "./school_subscription.controller";
import {
  cancelSchoolSubscriptionValidation,
  createSchoolSubscriptionValidation,
  generateStudentCodesSchema,
  renewSchoolSubscriptionValidation,
  updateSchoolSubscriptionValidation,
} from "./school_subscription.validation";

const router = Router();

// 01: Create new school subscription (admin only)
router.post(
  "/",
  validate(createSchoolSubscriptionValidation),
  verifyAdminToken,
  createSchoolSubscription,
);

// 02: Get all subscriptions for a school
router.get("/school/:schoolId", verifyAdminToken, getSchoolSubscriptions);

// 03: Get active subscription for school
router.get(
  "/school/:schoolId/active",
  verifyAdminToken,
  getActiveSchoolSubscription,
);

// 04: Get subscription by ID
router.get("/:subscriptionId", verifyAdminToken, getSchoolSubscriptionById);

// 05: Update subscription
router.patch(
  "/:subscriptionId",
  validate(updateSchoolSubscriptionValidation),
  verifyAdminToken,
  updateSchoolSubscription,
);

// 06: Renew subscription
router.post(
  "/:subscriptionId/renew",
  validate(renewSchoolSubscriptionValidation),
  verifyAdminToken,
  renewSchoolSubscription,
);

// 07: Cancel subscription
router.post(
  "/:subscriptionId/cancel",
  validate(cancelSchoolSubscriptionValidation),
  verifyAdminToken,
  cancelSchoolSubscription,
);

// 08: Get expired subscriptions
router.get("/expired/list", verifyAdminToken, getExpiredSubscriptions);

// 09: Generate per-student redemption codes (admin only)
router.post(
  "/:subscriptionId/generate-codes",
  validate(generateStudentCodesSchema),
  verifyAdminToken,
  generateStudentCodes,
);

// 10: Get all student codes for a school subscription (admin only)
router.get(
  "/:subscriptionId/codes",
  verifyAdminToken,
  getCodesBySchoolSubscription,
);

export default router;

/**
 * Handler group for school_subscription module.
 * Import in src/routes/admin.routes.ts — NO auth middleware here.
 */
export const schoolSubscriptionHandlers = {
  // Admin-specific
  admin: {
    validateCreate: validate(createSchoolSubscriptionValidation),
    create: createSchoolSubscription,
    getBySchool: getSchoolSubscriptions,
    getActiveBySchool: getActiveSchoolSubscription,
    getById: getSchoolSubscriptionById,
    validateUpdate: validate(updateSchoolSubscriptionValidation),
    update: updateSchoolSubscription,
    validateRenew: validate(renewSchoolSubscriptionValidation),
    renew: renewSchoolSubscription,
    validateCancel: validate(cancelSchoolSubscriptionValidation),
    cancel: cancelSchoolSubscription,
    getExpired: getExpiredSubscriptions,
    validateGenerateCodes: validate(generateStudentCodesSchema),
    generateCodes: generateStudentCodes,
    getCodes: getCodesBySchoolSubscription,
  },
};
