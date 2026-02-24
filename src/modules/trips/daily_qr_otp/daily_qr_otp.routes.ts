import { Router } from "express";

import {
  validate,
  verifyParentToken,
  verifyToken_Middleware,
} from "@shared/middlewares";

import {
  generateQrOtp,
  getParentOtpForTrip,
  getQrOtp,
  getQrOtpForParent,
  verifyAndRecordAttendance,
  verifyQrOtp,
} from "./daily_qr_otp.controller";
import {
  generateQrOtpSchema,
  verifyAndRecordAttendanceSchema,
  verifyQrOtpSchema,
} from "./daily_qr_otp.validation";

const router = Router();

// 01. Generate QR/OTP (requires authentication)
router.post(
  "/generate",
  verifyToken_Middleware,
  validate(generateQrOtpSchema),
  generateQrOtp,
);

// 02. Get QR/OTP for Student Trip (any authenticated user)
router.get(
  "/student/:studentId/trip/:tripId",
  verifyToken_Middleware,
  getQrOtp,
);

// 03. Get QR/OTP for Parent (parent-only with permission check)
router.get(
  "/parent/student/:studentId/trip/:tripId",
  verifyParentToken,
  getQrOtpForParent,
);

// 04. Get parent's OTP for a trip (returns single OTP covering all their children)
router.get("/parent/trip/:tripId", verifyParentToken, getParentOtpForTrip);

// 05. Verify QR/OTP - returns list of students covered (does not mark as used)
router.post(
  "/verify",
  verifyToken_Middleware,
  validate(verifyQrOtpSchema),
  verifyQrOtp,
);

// 06. Verify and record attendance - marks which students are present/absent
router.post(
  "/verify-attendance",
  verifyToken_Middleware,
  validate(verifyAndRecordAttendanceSchema),
  verifyAndRecordAttendance,
);

export default router;

/**
 * Handler group for daily_qr_otp module.
 * Import in src/routes/parent.routes.ts, driver.routes.ts — NO auth middleware here.
 */
export const qrOtpHandlers = {
  // Driver-specific (generate, verify)
  driver: {
    validateGenerate: validate(generateQrOtpSchema),
    generate: generateQrOtp,
    getForStudentTrip: getQrOtp,
    validateVerify: validate(verifyQrOtpSchema),
    verify: verifyQrOtp,
    validateVerifyAttendance: validate(verifyAndRecordAttendanceSchema),
    verifyAttendance: verifyAndRecordAttendance,
  },

  // Parent-specific
  parent: {
    getForStudentTrip: getQrOtpForParent,
    getForTrip: getParentOtpForTrip,
  },
};
