import { Router } from "express";

import { authHandlers } from "@modules/auth/auth.routes";

const router = Router();

// --- Roles ---
router.get("/roles", authHandlers.public.getRoles);

// --- Login ---
router.post(
  "/login/send-otp",
  authHandlers.public.validateSendLoginOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.sendLoginOtp,
);
router.post(
  "/login/verify-otp",
  authHandlers.public.validateVerifyLoginOtp,
  authHandlers.public.loginRateLimiter,
  authHandlers.public.verifyLoginOtp,
);

// --- Session ---
router.get("/verify-token", authHandlers.public.verifyToken);
router.post("/logout", authHandlers.public.logout);

export default router;
