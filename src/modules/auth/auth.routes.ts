import { loginRateLimiter, validate } from "@shared/middlewares";

import {
  activateUserController,
  deactivateUserController,
  getAllUsersController,
  roles as getRoles,
  logout,
  resendLoginOtp,
  resendRegisterOtp,
  sendLoginOtp,
  sendPhoneOtp,
  verifyAuthToken,
  verifyLoginOtp,
  verifyPhoneOtp,
} from "./auth.controller";
import {
  sendLoginOtpSchema,
  sendOTPSchema,
  verifyLoginOtpSchema,
  verifyOTPSchema,
} from "./auth.validation";

/**
 * Handler group for auth module.
 * Import in src/routes/auth.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const authHandlers = {
  // Public (no auth)
  public: {
    getRoles: getRoles,
    validateSendOtp: validate(sendOTPSchema),
    sendPhoneOtp: sendPhoneOtp,
    validateVerifyOtp: validate(verifyOTPSchema),
    verifyPhoneOtp: verifyPhoneOtp,
    validateSendLoginOtp: validate(sendLoginOtpSchema),
    sendLoginOtp: sendLoginOtp,
    validateVerifyLoginOtp: validate(verifyLoginOtpSchema),
    verifyLoginOtp: verifyLoginOtp,
    resendRegisterOtp: resendRegisterOtp,
    resendLoginOtp: resendLoginOtp,
    verifyToken: verifyAuthToken,
    logout: logout,
    loginRateLimiter: loginRateLimiter,
  },

  // Admin-specific
  admin: {
    getAllUsers: getAllUsersController,
    activateUser: activateUserController,
    deactivateUser: deactivateUserController,
  },
};
