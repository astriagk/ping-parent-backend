import { Router } from "express";

import { authHandlers } from "@modules/auth/auth.routes";

const router = Router();

/**
 * AUTH GATEWAY — Public endpoints (no auth required)
 * OTP send/verify, login, token verification, logout
 */

// 01. Get All Roles
router.get("/roles", authHandlers.public.getRoles);

// 02. Register - Send OTP (Parent/Driver)
router.post(
  "/register/send-otp",
  authHandlers.public.validateSendOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.sendPhoneOtp,
);

// 03. Register - Verify OTP (Parent/Driver)
router.post(
  "/register/verify-otp",
  authHandlers.public.validateVerifyOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.verifyPhoneOtp,
);

// 04. Login - Send OTP
router.post(
  "/login/send-otp",
  authHandlers.public.validateSendOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.sendLoginOtp,
);

// 05. Login - Verify OTP
router.post(
  "/login/verify-otp",
  authHandlers.public.validateVerifyOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.verifyLoginOtp,
);

// 06. Verify Token
router.get("/verify-token", authHandlers.public.verifyToken);

// 07. Logout
router.post("/logout", authHandlers.public.logout);

export default router;
