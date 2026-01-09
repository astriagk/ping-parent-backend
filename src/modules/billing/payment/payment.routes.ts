import { Router } from "express";

import {
  validate,
  verifyAdminToken,
  verifyParentToken,
} from "@shared/middlewares";

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
} from "./payment.controller";
import { createPaymentSchema, updatePaymentSchema } from "./payment.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// 01. Make Payment
router.post("/", validate(createPaymentSchema), createPayment);

// 02. Complete Payment
router.post("/:id/complete", completePaymentById);

// 03. Get Payment History
router.get("/my-payments", getMyPayments);

// Additional Routes
// Get Pending Payments
router.get("/my-payments/pending", getMyPendingPayments);

// Get Completed Payments
router.get("/my-payments/completed", getMyCompletedPayments);

// Get Payment by ID
router.get("/:id", getPaymentByIdController);

// Update Payment
router.put("/:id", validate(updatePaymentSchema), updatePaymentById);

// Refund Payment
router.post("/:id/refund", refundPaymentById);

// Admin routes
router.get("/admin/all-payments", verifyAdminToken, getAllPaymentsController);

export default router;
