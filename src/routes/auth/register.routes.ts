import { Router } from "express";

import { authHandlers } from "@modules/auth/auth.routes";

const router = Router();

// --- Register ---
router.post(
  "/register/send-otp",
  authHandlers.public.validateSendOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.sendPhoneOtp,
);
router.post(
  "/register/verify-otp",
  authHandlers.public.validateVerifyOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.verifyPhoneOtp,
);
router.post(
  "/register/resend-otp",
  authHandlers.public.validateSendOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.resendRegisterOtp,
);

export default router;
