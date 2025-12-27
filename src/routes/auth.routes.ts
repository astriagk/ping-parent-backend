import { Router } from "express";

import {
  roles as getRoles,
  logout,
  sendLoginOtp,
  sendPhoneOtp,
  verifyAuthToken,
  verifyLoginOtp,
  verifyPhoneOtp,
} from "@controllers/auth.controller";
import { loginRateLimiter, validate } from "@middlewares";

import { sendOTPSchema, verifyOTPSchema } from "../validations/auth.validation";

const router = Router();

router.get("/auth/roles", getRoles);
// New phone-based registration (3 steps, no password)
router.post(
  "/auth/register/send-otp",
  validate(sendOTPSchema),
  loginRateLimiter,
  sendPhoneOtp,
);
router.post(
  "/auth/register/verify-otp",
  validate(verifyOTPSchema),
  loginRateLimiter,
  verifyPhoneOtp,
);
// Phone-based login (2 steps, OTP-based)
router.post(
  "/auth/login/send-otp",
  validate(sendOTPSchema),
  loginRateLimiter,
  sendLoginOtp,
);
router.post(
  "/auth/login/verify-otp",
  validate(verifyOTPSchema),
  loginRateLimiter,
  verifyLoginOtp,
);
// Token verification and logout
router.get("/auth/verify-token", verifyAuthToken);
router.post("/auth/logout", logout);

export default router;
