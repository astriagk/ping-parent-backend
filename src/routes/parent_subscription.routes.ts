import { Router } from "express";

import {
  cancelSubscriptionById,
  createSubscription,
  deleteSubscriptionById,
  getMyActiveSubscription,
  getMySubscriptions,
  getSubscriptionById,
  updateSubscriptionById,
} from "@controllers/parent_subscription.controller";
import { validate, verifyParentToken } from "@middlewares";
import {
  createParentSubscriptionSchema,
  updateParentSubscriptionSchema,
} from "@validations/parent_subscription.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// Parent subscription CRUD operations
router.post("/", validate(createParentSubscriptionSchema), createSubscription);
router.get("/my-subscriptions", getMySubscriptions);
router.get("/my-active-subscription", getMyActiveSubscription);
router.get("/:id", getSubscriptionById);
router.put(
  "/:id",
  validate(updateParentSubscriptionSchema),
  updateSubscriptionById,
);
router.post("/:id/cancel", cancelSubscriptionById);
router.delete("/:id", deleteSubscriptionById);

export default router;
