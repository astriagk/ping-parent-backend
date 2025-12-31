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

// 01. Generate QR/OTP
router.post("/generate", validate(generateQrOtpSchema), generateQrOtp);

// 02. Get QR/OTP for Student Trip
router.get("/student/:studentId/trip/:tripId", getQrOtp);

// 03. Verify QR/OTP
router.post("/verify", validate(verifyQrOtpSchema), verifyQrOtp);

export default router;
