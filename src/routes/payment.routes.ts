import { Router } from "express";

import {
  completePaymentById,
  createPayment,
  getAllPaymentsController,
  getMyCompletedPayments,
  getMyPayments,
  getMyPendingPayments,
  getPaymentByIdController,
  refundPaymentById,
  updatePaymentById,
} from "@controllers/payment.controller";
import { validate, verifyAdminToken, verifyParentToken } from "@middlewares";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "@validations/payment.validation";

const router = Router();

// Admin routes
router.get("/admin/all-payments", verifyAdminToken, getAllPaymentsController);

// All other routes require parent authentication
router.use(verifyParentToken);

// Payment operations
router.post("/", validate(createPaymentSchema), createPayment);
router.get("/my-payments", getMyPayments);
router.get("/my-payments/pending", getMyPendingPayments);
router.get("/my-payments/completed", getMyCompletedPayments);
router.get("/:id", getPaymentByIdController);
router.put("/:id", validate(updatePaymentSchema), updatePaymentById);
router.post("/:id/complete", completePaymentById);
router.post("/:id/refund", refundPaymentById);

export default router;
