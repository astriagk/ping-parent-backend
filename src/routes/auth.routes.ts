import {
  verifyAuthToken,
  register,
  roles as getRoles,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendLoginOtp,
  verifyLoginOtp,
  logout,
} from "@controllers/auth.controller";
import { loginRateLimiter } from "@middleware/rateLimit";
import { Router } from "express";

const router = Router();

router.get("/auth/roles", getRoles);
// Original registration (with password)
router.post("/auth/register", register);
// New phone-based registration (3 steps, no password)
router.post("/auth/register/send-otp", sendPhoneOtp);
router.post("/auth/register/verify-otp", verifyPhoneOtp);
// Phone-based login (2 steps, OTP-based)
router.post("/auth/login/send-otp", sendLoginOtp);
router.post("/auth/login/verify-otp", verifyLoginOtp);
// Traditional email/password login
router.post("/auth/login", loginRateLimiter, login);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/reset-password", resetPassword);
router.get("/auth/verify-token", verifyAuthToken);
router.post("/auth/logout", logout);

export default router;
