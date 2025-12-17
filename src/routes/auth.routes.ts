import { Router } from "express";
import {
  verifyAuthToken,
  register,
  roles as getRoles,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/auth.controller";
import { loginRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.get("/auth/roles", getRoles);
router.post("/auth/register", register);
router.post("/auth/login", loginRateLimiter, login);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/reset-password", resetPassword);
router.get("/auth/verify-token", verifyAuthToken);

export default router;
