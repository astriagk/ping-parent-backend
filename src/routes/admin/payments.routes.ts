import { Router } from "express";

import { paymentHandlers } from "@modules/billing/payment/payment.routes";

const router = Router();

// --- Payments ---
router.get("/payments", paymentHandlers.admin.getAll);
router.get("/payments/:id", paymentHandlers.admin.getById);

export default router;
