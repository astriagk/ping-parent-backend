import { Router } from "express";

import { schoolSubscriptionHandlers } from "@modules/billing/school_subscription/school_subscription.routes";

const router = Router();

// --- School Subscriptions ---
router.get("/school-subscriptions", schoolSubscriptionHandlers.admin.getAll);
router.post(
  "/school-subscriptions",
  schoolSubscriptionHandlers.admin.validateCreate,
  schoolSubscriptionHandlers.admin.create,
);
router.get(
  "/school-subscriptions/school/:schoolId",
  schoolSubscriptionHandlers.admin.getBySchool,
);
router.get(
  "/school-subscriptions/school/:schoolId/active",
  schoolSubscriptionHandlers.admin.getActiveBySchool,
);
router.get(
  "/school-subscriptions/expired/list",
  schoolSubscriptionHandlers.admin.getExpired,
);
router.get(
  "/school-subscriptions/:subscriptionId",
  schoolSubscriptionHandlers.admin.getById,
);
router.patch(
  "/school-subscriptions/:subscriptionId",
  schoolSubscriptionHandlers.admin.validateUpdate,
  schoolSubscriptionHandlers.admin.update,
);
router.post(
  "/school-subscriptions/:subscriptionId/renew",
  schoolSubscriptionHandlers.admin.validateRenew,
  schoolSubscriptionHandlers.admin.renew,
);
router.post(
  "/school-subscriptions/:subscriptionId/cancel",
  schoolSubscriptionHandlers.admin.validateCancel,
  schoolSubscriptionHandlers.admin.cancel,
);
router.post(
  "/school-subscriptions/:subscriptionId/generate-codes",
  schoolSubscriptionHandlers.admin.validateGenerateCodes,
  schoolSubscriptionHandlers.admin.generateCodes,
);
router.get(
  "/school-subscriptions/:subscriptionId/codes",
  schoolSubscriptionHandlers.admin.getCodes,
);

export default router;
