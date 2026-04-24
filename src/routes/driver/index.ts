import { Router } from "express";

import { verifyDriverToken } from "@shared/middlewares";

import addressRouter from "./address.routes";
import assignmentsRouter from "./assignments.routes";
import availabilityRouter from "./availability.routes";
import documentsRouter from "./documents.routes";
import onboardingRouter from "./onboarding.routes";
import profileRouter from "./profile.routes";
import qrOtpRouter from "./qr-otp.routes";
import trackingRouter from "./tracking.routes";
import tripStudentsRouter from "./trip-students.routes";
import tripsRouter from "./trips.routes";

const router = Router();

/**
 * DRIVER GATEWAY — verifyDriverToken applied ONCE
 * All routes below require driver token.
 */
router.use(verifyDriverToken);

router.use("/", profileRouter);
router.use("/", availabilityRouter);
router.use("/", addressRouter);
router.use("/", documentsRouter);
router.use("/", onboardingRouter);
router.use("/", tripsRouter);
router.use("/", tripStudentsRouter);
router.use("/", assignmentsRouter);
router.use("/", qrOtpRouter);
router.use("/", trackingRouter);

export default router;
