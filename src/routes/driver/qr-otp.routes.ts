import { Router } from "express";

import { qrOtpHandlers } from "@modules/trips/daily_qr_otp/daily_qr_otp.routes";

const router = Router();

// --- QR / OTP ---
router.post(
  "/qr-otp/generate",
  qrOtpHandlers.driver.validateGenerate,
  qrOtpHandlers.driver.generate,
);
router.get(
  "/qr-otp/student/:studentId/trip/:tripId",
  qrOtpHandlers.driver.getForStudentTrip,
);
router.post(
  "/qr-otp/verify",
  qrOtpHandlers.driver.validateVerify,
  qrOtpHandlers.driver.verify,
);
router.post(
  "/qr-otp/verify-attendance",
  qrOtpHandlers.driver.validateVerifyAttendance,
  qrOtpHandlers.driver.verifyAttendance,
);

export default router;
