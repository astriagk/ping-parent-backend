import { Request, Response } from "express";

import { getAllRoles } from "@modules/admin/role/role.service";
import { createParentProfile } from "@modules/users/parent/parent.service";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
  UserRole,
} from "@shared/constants";
import { asyncHandler } from "@shared/middlewares";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "@shared/services/token.service";
import { sendOtp, verifyOtp } from "@shared/services/twilio-otp.service";
import { ApiError, normalizePhone } from "@shared/utils";

import {
  activateUser,
  createUser,
  deactivateUser,
  getAllUsers,
  getUserById,
  getUserByPhone,
  updateLastLogin,
} from "./auth.service";

// Default country code for phone numbers
const DEFAULT_COUNTRY_CODE = "+91";

export const verifyAuthToken = asyncHandler(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MALFORMED_AUTH_HEADER,
      );
    }

    try {
      const payload = verifyAccessToken(token);

      const user = await getUserById(payload.userId);

      if (!user) {
        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
        );
      }

      return res.json({
        success: true,
        data: {
          userId: payload.userId,
          role: payload.role || "",
          tokenValid: true,
        },
      });
    } catch (err: any) {
      // handle expired token and optional refresh
      if (err.name === "TokenExpiredError") {
        const refresh = req.headers["x-refresh-token"] as string | undefined;
        if (refresh) {
          try {
            const refreshPayload = verifyRefreshToken(refresh);
            const newToken = generateAccessToken({
              userId: refreshPayload.userId,
              role: refreshPayload.role,
            });

            return res.json({
              success: true,
              data: {
                userId: refreshPayload.userId,
                role: refreshPayload.role || "",
                tokenValid: true,
                newToken,
              },
            });
          } catch {
            throw new ApiError(
              HTTP_STATUS.UNAUTHORIZED,
              ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
            );
          }
        }

        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
        );
      }

      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
    }
  },
);

export const roles = asyncHandler(async (_req: Request, res: Response) => {
  const allowed = await getAllRoles();
  return res.json({ success: true, data: allowed });
});

// Phone-based Login (2 steps)
// Step 1: Send OTP for login
export const sendLoginOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, countryCode } = req.body;
    const code = countryCode || DEFAULT_COUNTRY_CODE;

    if (!phone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.PHONE_REQUIRED,
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_PHONE,
      );
    }

    const user = await getUserByPhone(normalizedPhone);

    // If user doesn't exist, return error
    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PHONE.PHONE_NOT_REGISTERED,
      );
    }

    // Send OTP via Twilio
    try {
      await sendOtp(code + normalizedPhone);
    } catch (_error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.PHONE.LOGIN_OTP_SENDING_FAILED,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PHONE.LOGIN_OTP_SENT,
    });
  },
);

// Step 2: Verify OTP and login
export const verifyLoginOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp, countryCode } = req.body;
    const code = countryCode || DEFAULT_COUNTRY_CODE;

    if (!phone || !otp) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.PHONE_LOGIN_OTP_REQUIRED,
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_PHONE,
      );
    }

    // Verify OTP via Twilio
    let isOtpValid = false;

    try {
      const twilioResult = await verifyOtp(code + normalizedPhone, otp);
      isOtpValid = twilioResult.valid;
    } catch (_error) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.OTP_VERIFICATION_FAILED,
      );
    }

    if (!isOtpValid) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_OR_EXPIRED_OTP,
      );
    }

    // Get user and generate token
    const user = await getUserByPhone(normalizedPhone);
    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
      );
    }

    if (!user.is_active) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_MESSAGES.AUTH.USER_DEACTIVATED,
      );
    }

    const userId = String(user._id);
    await updateLastLogin(userId);

    const { accessToken, refreshToken } = generateTokenPair({
      userId,
      role: user.user_type || "parent",
    });

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          role: user.user_type || "parent",
          phone: user.phone_number,
        },
      },
      message: SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESSFUL,
    });
  },
);

// Phone-based Registration (3 steps)
// Step 1: Send OTP to phone number
export const sendPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, countryCode } = req.body;
    const code = countryCode || DEFAULT_COUNTRY_CODE;

    if (!phone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.PHONE_REQUIRED,
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_PHONE,
      );
    }

    // Check if phone already registered
    const existing = await getUserByPhone(normalizedPhone);
    if (existing) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED,
      );
    }

    // Send OTP via Twilio
    try {
      await sendOtp(code + normalizedPhone);
    } catch (_error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.PHONE.OTP_SENDING_FAILED,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PHONE.OTP_SENT,
    });
  },
);

// Resend OTP for registration
export const resendRegisterOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, countryCode } = req.body;
    const code = countryCode || DEFAULT_COUNTRY_CODE;

    if (!phone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.PHONE_REQUIRED,
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_PHONE,
      );
    }

    const existing = await getUserByPhone(normalizedPhone);
    if (existing) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED,
      );
    }

    try {
      await sendOtp(code + normalizedPhone);
    } catch (_error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.PHONE.OTP_SENDING_FAILED,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PHONE.REGISTER_OTP_RESENT,
    });
  },
);

// Resend OTP for login
export const resendLoginOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, countryCode } = req.body;
    const code = countryCode || DEFAULT_COUNTRY_CODE;

    if (!phone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.PHONE_REQUIRED,
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_PHONE,
      );
    }

    const user = await getUserByPhone(normalizedPhone);
    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PHONE.PHONE_NOT_REGISTERED,
      );
    }

    try {
      await sendOtp(code + normalizedPhone);
    } catch (_error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.PHONE.LOGIN_OTP_SENDING_FAILED,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PHONE.LOGIN_OTP_RESENT,
    });
  },
);

// Step 2: Verify OTP
export const verifyPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp, role, countryCode } = req.body;
    const code = countryCode || DEFAULT_COUNTRY_CODE;

    if (!phone || !otp) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.PHONE_AND_OTP_REQUIRED,
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_PHONE,
      );
    }

    // Verify OTP via Twilio
    let isOtpValid = false;

    try {
      const twilioResult = await verifyOtp(code + normalizedPhone, otp);
      isOtpValid = twilioResult.valid;
    } catch (_error) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.OTP_VERIFICATION_FAILED,
      );
    }

    if (!isOtpValid) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PHONE.INVALID_OR_EXPIRED_OTP,
      );
    }

    // Check if user already exists with this phone
    let user = await getUserByPhone(normalizedPhone);
    let isNewUser = false;

    if (!user) {
      // Create new user with phone number
      isNewUser = true;
      const userType =
        role === UserRole.DRIVER ? UserRole.DRIVER : UserRole.PARENT;

      await createUser({
        phone_number: normalizedPhone,
        user_type: userType,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Fetch the newly created user
      user = await getUserByPhone(normalizedPhone);

      if (!user) {
        throw new ApiError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
        );
      }

      // Only create parent profile for parent role
      if (user.user_type === UserRole.PARENT) {
        const profile = await createParentProfile(String(user._id), {});
        if (!profile) {
          throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          );
        }
      }
    } else if (!user.is_active) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_MESSAGES.AUTH.USER_DEACTIVATED,
      );
    }

    const userId = String(user._id);
    await updateLastLogin(userId);

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId,
      role: user.user_type || "parent",
    });

    return res.json({
      success: true,
      message: isNewUser
        ? SUCCESS_MESSAGES.PHONE.PHONE_VERIFIED_SUCCESSFULLY
        : SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESSFUL,
      isNewUser,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          phone: user.phone_number,
          userType: user.user_type || "parent",
          isActive: user.is_active,
        },
      },
    });
  },
);

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.AUTH.LOGGED_OUT_SUCCESSFULLY,
  });
});

/**
 * Get all users (admin only)
 */
export const getAllUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await getAllUsers();

    return res.json({
      success: true,
      data: users,
      count: users.length,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

/**
 * Activate user (admin only)
 */
export const activateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const user = await activateUser(id);

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: user,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

/**
 * Deactivate user (admin only)
 */
export const deactivateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const user = await deactivateUser(id);

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.AUTH.USER_DEACTIVATED_SUCCESSFULLY,
    });
  },
);
