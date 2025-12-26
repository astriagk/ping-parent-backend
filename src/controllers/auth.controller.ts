import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@constants";
import { recordFailedLogin } from "@middleware/rateLimit";
import {
  consumeResetToken,
  createOtpForEmail,
  createPhoneOtp,
  createUser,
  getAllRoles,
  getUserByEmail,
  getUserById,
  getUserByPhone,
  updateUserPassword,
  verifyOtpAndCreateResetToken,
  verifyPhoneOtp as verifyOtpService,
} from "@services";
import {
  normalizePhone,
  sendPasswordResetOTP,
  sendVerificationEmail,
  signAccessToken,
  signEmailToken,
  validateEmail,
  validatePassword,
  verifyToken,
} from "@utils";

export const verifyAuthToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MALFORMED_AUTH_HEADER,
    });
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: ERROR_MESSAGES.AUTH.USER_NOT_FOUND });
    }

    return res.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
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
            const newToken = signAccessToken({
              userId: refreshPayload.userId,
              email: refreshPayload.email,
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
          return res.status(401).json({
            success: false,
            error: ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
          });
        }
      }

      return res
        .status(401)
        .json({ success: false, error: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED });
    }

    return res
      .status(401)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.INVALID_TOKEN });
  }
};

export const roles = async (_req: Request, res: Response) => {
  try {
    const allowed = await getAllRoles();
    return res.json({ success: true, data: allowed });
  } catch {
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.FAILED_TO_FETCH_ROLES,
    });
  }
};

// Phone-based Login (2 steps)
// Step 1: Send OTP for login
export const sendLoginOtp = async (req: Request, res: Response) => {
  const { phone } = req.body || {};

  if (!phone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.PHONE_REQUIRED });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.INVALID_PHONE });
  }

  const user = await getUserByPhone(normalizedPhone);

  // If user doesn't exist, return error
  if (!user) {
    return res.status(404).json({
      success: false,
      error: ERROR_MESSAGES.PHONE.PHONE_NOT_REGISTERED,
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to database
  await createPhoneOtp(normalizedPhone, otp, 10);

  // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
  console.log(`Login OTP for ${normalizedPhone}: ${otp}`);

  return res.json({
    success: true,
    message: SUCCESS_MESSAGES.PHONE.LOGIN_OTP_SENT,
    // Remove in production - only for development
    ...(process.env.NODE_ENV === "dev" && { otp }),
  });
};

// Step 2: Verify OTP and login
export const verifyLoginOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body || {};

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.PHONE.PHONE_LOGIN_OTP_REQUIRED,
    });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.INVALID_PHONE });
  }

  const verified = await verifyOtpService(normalizedPhone, otp);

  if (!verified) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.PHONE.INVALID_OR_EXPIRED_OTP,
    });
  }

  // Get user and generate token
  const user = await getUserByPhone(normalizedPhone);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.USER_NOT_FOUND });
  }

  const token = signAccessToken({
    userId: user._id ? String(user._id) : user.email,
    email: user.email,
    role: user.user_type || user.role || "parent",
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id ? String(user._id) : undefined,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.user_type || user.role || "parent",
        phone: user.phone_number || user.phone,
      },
    },
    message: SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESSFUL,
  });
};

// Phone-based Registration (3 steps)
// Step 1: Send OTP to phone number
export const sendPhoneOtp = async (req: Request, res: Response) => {
  const { phone, role } = req.body || {};

  if (!phone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.PHONE_REQUIRED });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.INVALID_PHONE });
  }

  // Check if phone already registered
  const existing = await getUserByPhone(normalizedPhone);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED,
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to database
  await createPhoneOtp(normalizedPhone, otp, 10);

  // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
  console.log(`OTP for ${normalizedPhone}: ${otp}`);

  return res.json({
    success: true,
    message: SUCCESS_MESSAGES.PHONE.OTP_SENT,
    // Remove in production - only for development
    ...(process.env.NODE_ENV === "dev" && { otp }),
  });
};

// Step 2: Verify OTP
export const verifyPhoneOtp = async (req: Request, res: Response) => {
  const { phone, otp, role } = req.body || {};

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.PHONE.PHONE_AND_OTP_REQUIRED,
    });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.INVALID_PHONE });
  }

  const verified = await verifyOtpService(normalizedPhone, otp);

  if (!verified) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.PHONE.INVALID_OR_EXPIRED_OTP,
    });
  }

  // Check if user already exists with this phone
  let user = await getUserByPhone(normalizedPhone);
  let isNewUser = false;

  if (!user) {
    // Create new user with phone number
    isNewUser = true;
    const newUserData = {
      phone_number: normalizedPhone,
      user_type: role || ("parent" as "parent" | "driver"),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await createUser(newUserData as any);

    // Fetch the newly created user
    user = await getUserByPhone(normalizedPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
      });
    }
  }

  // Generate token
  const token = signAccessToken({
    userId: user._id ? String(user._id) : normalizedPhone,
    role: user.user_type || user.role || "parent",
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
        phone: user.phone_number || user.phone,
        userType: user.user_type || user.role || "parent",
        isActive: user.is_active !== undefined ? user.is_active : true,
      },
    },
  });
};

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, role } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
    });
  }

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.INVALID_EMAIL });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT,
    });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE.INVALID_PHONE });
  }

  // check duplicate
  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.EMAIL_ALREADY_IN_USE,
    });
  }

  // validate role (fetch allowed roles from DB)
  let allowed: string[] = [];
  try {
    allowed = await getAllRoles();
  } catch {
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.UNABLE_TO_VALIDATE_ROLE,
    });
  }

  const selectedRole = role ? String(role) : allowed[0] || "parent";
  if (!allowed.includes(selectedRole)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.INVALID_ROLE });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // create verification token
  const tempPayload = { userId: email, email, role: selectedRole };
  const verificationToken = signEmailToken(tempPayload);

  const newUser = {
    firstName,
    lastName,
    email: email.toLowerCase(),
    passwordHash,
    phone: normalizedPhone,
    role: selectedRole,
    emailVerified: false,
    verificationToken,
    createdAt: new Date(),
  };

  const result = await createUser(newUser as any);
  const userId = result.insertedId ? result.insertedId.toString() : undefined;

  // send verification email (best-effort)
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (e) {
    console.warn("Error sending verification email", e);
  }

  // sign access token for immediate login
  const token = signAccessToken({
    userId: userId || email,
    email,
    role: selectedRole,
  });

  return res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        role: selectedRole,
        emailVerified: false,
      },
    },
    message: SUCCESS_MESSAGES.AUTH.REGISTRATION_EMAIL_SENT,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const ip = req.ip;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_EMAIL_OR_PASSWORD,
    });
  }

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.INVALID_EMAIL });
  }

  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    recordFailedLogin(email || ip);
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
      },
    });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    recordFailedLogin(email || ip);
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
      },
    });
  }

  const token = signAccessToken({
    userId: user._id ? String(user._id) : email,
    email: user.email,
    role: user.role || "parent",
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id ? String(user._id) : undefined,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || "parent",
        phone: user.phone,
      },
    },
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email || !validateEmail(email)) {
    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT,
    });
  }

  try {
    const user = await getUserByEmail(email);
    // Always return same response for privacy
    if (!user) {
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await createOtpForEmail(email, otp, 10);
    await sendPasswordResetOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT,
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.SERVER_ERROR });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body || {};
  if (!email || !otp || !validateEmail(email) || typeof otp !== "string") {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_EMAIL_OR_OTP,
    });
  }

  try {
    const resetToken = await verifyOtpAndCreateResetToken(email, otp);
    if (!resetToken)
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.PHONE.INVALID_OR_EXPIRED_OTP,
      });
    return res.json({ success: true, data: { resetToken } });
  } catch {
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.SERVER_ERROR });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body || {};
  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_RESET_TOKEN_OR_PASSWORD,
    });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.PASSWORD_REQUIREMENTS,
    });
  }

  try {
    const email = await consumeResetToken(resetToken);
    if (!email)
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.INVALID_RESET_TOKEN,
      });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, passwordHash);

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS,
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.AUTH.SERVER_ERROR });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.LOGGED_OUT_SUCCESSFULLY,
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.SERVER_ERROR,
    });
  }
};
