import { Router } from "express";

import {
  loginRateLimiter,
  validate,
  verifyAdminToken,
} from "@shared/middlewares";

import {
  activateUserController,
  deactivateUserController,
  getAllUsersController,
  roles as getRoles,
  logout,
  sendLoginOtp,
  sendPhoneOtp,
  verifyAuthToken,
  verifyLoginOtp,
  verifyPhoneOtp,
} from "./auth.controller";
import { sendOTPSchema, verifyOTPSchema } from "./auth.validation";

const router = Router();

// 01. Get All Roles
router.get("/roles", getRoles);

// 02. Register - Send OTP (Parent/Driver)
router.post(
  "/register/send-otp",
  validate(sendOTPSchema),
  loginRateLimiter,
  sendPhoneOtp,
);

// 03. Register - Verify OTP (Parent/Driver)
router.post(
  "/register/verify-otp",
  validate(verifyOTPSchema),
  loginRateLimiter,
  verifyPhoneOtp,
);

// 04. Login - Send OTP
router.post(
  "/login/send-otp",
  validate(sendOTPSchema),
  loginRateLimiter,
  sendLoginOtp,
);

// 05. Login - Verify OTP
router.post(
  "/login/verify-otp",
  validate(verifyOTPSchema),
  loginRateLimiter,
  verifyLoginOtp,
);

// 06. Verify Token
router.get("/verify-token", verifyAuthToken);

// 07. Logout
router.post("/logout", logout);

// 08. Get All Users (Admin)
router.get("/admin/users", verifyAdminToken, getAllUsersController);

// 09. Activate User (Admin)
router.patch(
  "/admin/users/:id/activate",
  verifyAdminToken,
  activateUserController,
);

// 10. Deactivate User (Admin)
router.patch(
  "/admin/users/:id/deactivate",
  verifyAdminToken,
  deactivateUserController,
);

export default router;
