import { Router } from "express";

import { paymentHandlers } from "@modules/billing/payment/payment.routes";

const router = Router();

// --- Payments ---
router.post(
  "/payments",
  paymentHandlers.parent.validateCreate,
  paymentHandlers.parent.create,
);
router.post("/payments/:id/complete", paymentHandlers.parent.complete);
router.get("/payments", paymentHandlers.parent.getMyPayments);
router.get("/payments/pending", paymentHandlers.parent.getMyPending);
router.get("/payments/completed", paymentHandlers.parent.getMyCompleted);
router.get("/payments/:id", paymentHandlers.parent.getById);
router.put(
  "/payments/:id",
  paymentHandlers.parent.validateUpdate,
  paymentHandlers.parent.update,
);
router.post("/payments/:id/refund", paymentHandlers.parent.refund);

export default router;
