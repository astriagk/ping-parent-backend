import { validate } from "@shared/middlewares";

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

/**
 * Handler group for payment module.
 * Import in src/routes/parent.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const paymentHandlers = {
  // Parent-specific
  parent: {
    validateCreate: validate(createPaymentSchema),
    create: createPayment,
    complete: completePaymentById,
    getMyPayments: getMyPayments,
    getMyPending: getMyPendingPayments,
    getMyCompleted: getMyCompletedPayments,
    getById: getPaymentByIdController,
    validateUpdate: validate(updatePaymentSchema),
    update: updatePaymentById,
    refund: refundPaymentById,
  },

  // Admin-specific
  admin: {
    getAll: getAllPaymentsController,
    getById: getPaymentByIdController,
  },
};
