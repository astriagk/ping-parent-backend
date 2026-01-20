import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { getAllRoles } from "@modules/admin/role/role.service";
import { createParentProfile } from "@modules/users/parent/parent.service";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  UniqueCodeTypes,
  UserRole,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import {
  generateAccessToken,
  verifyAccessToken,
} from "@shared/services/token.service";
import { generateUniqueCode, logger, normalizePhone } from "@shared/utils";

import {
  activateUser,
  createPhoneOtp,
  createUser,
  deactivateUser,
  getAllUsers,
  getUserById,
  getUserByPhone,
  verifyPhoneOtp as verifyOtpService,
} from "./auth.service";

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
      if (err instanceof jwt.TokenExpiredError) {
        const refresh = req.headers["x-refresh-token"] as string | undefined;
        if (refresh) {
          try {
            const refreshPayload = jwt.verify(
              refresh,
              process.env.JWT_SECRET || "dev-secret",
            ) as any;
            if (refreshPayload?.userId) {
              // issue new access token
              const newToken = generateAccessToken({
                userId: refreshPayload.userId,
                role: refreshPayload.role,
              });

              return res.json({
                success: true,
                data: {
                  userId: refreshPayload.userId,
                  email: refreshPayload.email,
                  role: refreshPayload.role || "",
                  tokenValid: true,
                  newToken,
                },
              });
            }
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
    const { phone } = req.body;

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    await createPhoneOtp(normalizedPhone, otp, 10);

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    logger.info(`Login OTP for ${normalizedPhone}: ${otp}`);

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PHONE.LOGIN_OTP_SENT,
    });
  },
);

// Step 2: Verify OTP and login
export const verifyLoginOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp } = req.body;

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

    const verified = await verifyOtpService(normalizedPhone, otp);

    if (!verified) {
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

    const token = generateAccessToken({
      userId: user._id ? String(user._id) : "",
      role: user.user_type || "parent",
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id ? String(user._id) : undefined,
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
    const { phone } = req.body;

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    await createPhoneOtp(normalizedPhone, otp, 10);

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    logger.info(`OTP for ${normalizedPhone}: ${otp}`);

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PHONE.OTP_SENT,
    });
  },
);

// Step 2: Verify OTP
export const verifyPhoneOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp, role } = req.body;

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

    const verified = await verifyOtpService(normalizedPhone, otp);

    if (!verified) {
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
      const newUserData = {
        user_id: generateUniqueCode(UniqueCodeTypes.USER),
        phone_number: normalizedPhone,
        user_type: role === UserRole.DRIVER ? UserRole.DRIVER : UserRole.PARENT,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await createUser(newUserData);

      // Fetch the newly created user
      user = await getUserByPhone(normalizedPhone);

      if (!user) {
        throw new ApiError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
        );
      }
    }

    let createProfile = await createParentProfile(String(user._id), {});

    if (!createProfile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    // Generate token
    const token = generateAccessToken({
      userId: user._id ? String(user._id) : normalizedPhone,
      role: user.user_type || "parent",
    });

    return res.json({
      success: true,
      message: isNewUser
        ? SUCCESS_MESSAGES.PHONE.PHONE_VERIFIED_SUCCESSFULLY
        : SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESSFUL,
      isNewUser,
      data: {
        token,
        user: {
          id: user._id ? String(user._id) : undefined,
          phone: user.phone_number,
          userType: user.user_type || "parent",
          isActive: user.is_active !== undefined ? user.is_active : true,
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
      message: SUCCESS_MESSAGES.AUTH.USER_FETCHED_SUCCESSFULLY,
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
      message: SUCCESS_MESSAGES.AUTH.USER_ACTIVATED_SUCCESSFULLY,
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
