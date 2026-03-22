import { Router } from "express";

import { verifyParentToken } from "@shared/middlewares";

import assignmentsRouter from "./assignments.routes";
import paymentsRouter from "./payments.routes";
import profileRouter from "./profile.routes";
import qrOtpRouter from "./qr-otp.routes";
import redemptionsRouter from "./redemptions.routes";
import reviewsRouter from "./reviews.routes";
import studentsRouter from "./students.routes";
import subscriptionsRouter from "./subscriptions.routes";
import tripsRouter from "./trips.routes";

const router = Router();

/**
 * PARENT GATEWAY — verifyParentToken applied ONCE
 * All routes below require parent token.
 */
router.use(verifyParentToken);

router.use("/", profileRouter);
router.use("/", tripsRouter);
router.use("/", studentsRouter);
router.use("/", assignmentsRouter);
router.use("/", qrOtpRouter);
router.use("/", paymentsRouter);
router.use("/", subscriptionsRouter);
router.use("/", redemptionsRouter);
router.use("/", reviewsRouter);

export default router;
