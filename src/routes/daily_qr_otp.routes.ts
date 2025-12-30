import { Router } from "express";

import {
  generateQrOtp,
  getQrOtp,
  verifyQrOtp,
} from "@controllers/daily_qr_otp.controller";
import { validate, verifyToken_Middleware } from "@middlewares";
import {
  generateQrOtpSchema,
  verifyQrOtpSchema,
} from "@validations/daily_qr_otp.validation";

const router = Router();

// All routes require authentication
router.use(verifyToken_Middleware);

// Generate QR code and OTP for a student's trip
router.post("/generate", validate(generateQrOtpSchema), generateQrOtp);

// Get QR/OTP by student and trip
router.get("/student/:studentId/trip/:tripId", getQrOtp);

// Verify QR code or OTP
router.post("/verify", validate(verifyQrOtpSchema), verifyQrOtp);

export default router;
