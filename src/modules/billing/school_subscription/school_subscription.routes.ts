import { validate } from "@shared/middlewares";

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
