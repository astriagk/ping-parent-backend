import { Router } from "express";

import { qrOtpHandlers } from "@modules/trips/daily_qr_otp/daily_qr_otp.routes";

const router = Router();

// --- QR / OTP ---
router.get(
  "/qr-otp/student/:studentId/trip/:tripId",
  qrOtpHandlers.parent.getForStudentTrip,
);
router.get("/qr-otp/trip/:tripId", qrOtpHandlers.parent.getForTrip);

export default router;
