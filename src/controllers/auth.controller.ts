import { Request, Response } from "express";
import { verifyToken, signAccessToken, signEmailToken } from "../utils/jwt";
import {
  getUserById,
  createUser,
  getUserByEmail,
} from "../services/auth.service";
import jwt from "jsonwebtoken";
import { getAllRoles } from "../services/role.service";
import bcrypt from "bcryptjs";
import {
  validateEmail,
  validatePassword,
  normalizePhone,
} from "../utils/validation";
import { sendVerificationEmail } from "../utils/email";
import { loginRateLimiter, recordFailedLogin } from "../middleware/rateLimit";
import { sendPasswordResetOTP } from "../utils/email";
import {
  createOtpForEmail,
  verifyOtpAndCreateResetToken,
  consumeResetToken,
} from "../services/passwordReset.service";
import { updateUserPassword } from "../services/auth.service";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_CODES,
} from "../constants/messages";

export const verifyAuthToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: ERROR_MESSAGES.MISSING_AUTH_HEADER });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: ERROR_MESSAGES.MALFORMED_AUTH_HEADER });
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });
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
            process.env.JWT_SECRET || "dev-secret"
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
        } catch (e) {
          return res.status(401).json({
            success: false,
            error: ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
          });
        }
      }

      return res
        .status(401)
        .json({ success: false, error: ERROR_MESSAGES.TOKEN_EXPIRED });
    }

    return res
      .status(401)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_TOKEN });
  }
};

export const roles = async (_req: Request, res: Response) => {
  try {
    const allowed = await getAllRoles();
    return res.json({ success: true, data: allowed });
  } catch (e) {
    console.error("Error fetching roles", e);
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.FAILED_TO_FETCH_ROLES });
  }
};

// Phone-based Login (2 steps)
// Step 1: Send OTP for login
export const sendLoginOtp = async (req: Request, res: Response) => {
  const { phone } = req.body || {};

  if (!phone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_REQUIRED });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_PHONE });
  }

  // Check if phone is registered
  const { getUserByPhone } = require("../services/auth.service");
  const user = await getUserByPhone(normalizedPhone);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_NOT_REGISTERED });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to database
  const { createLoginOtp } = require("../services/auth.service");
  await createLoginOtp(normalizedPhone, otp, 10);

  // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
  console.log(`Login OTP for ${normalizedPhone}: ${otp}`);

  return res.json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_OTP_SENT,
    // Remove in production - only for development
    ...(process.env.NODE_ENV === "development" && { otp }),
  });
};

// Step 2: Verify OTP and login
export const verifyLoginOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body || {};

  if (!phone || !otp) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_LOGIN_OTP_REQUIRED });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_PHONE });
  }

  // Verify OTP
  const {
    verifyLoginOtp: verifyOtpService,
    getUserByPhone,
  } = require("../services/auth.service");
  const verified = await verifyOtpService(normalizedPhone, otp);

  if (!verified) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP });
  }

  // Get user and generate token
  const user = await getUserByPhone(normalizedPhone);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });
  }

  const token = signAccessToken({
    userId: user._id ? String(user._id) : user.email,
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
    message: SUCCESS_MESSAGES.LOGIN_SUCCESSFUL,
  });
};

// Phone-based Registration (3 steps)
// Step 1: Send OTP to phone number
export const sendPhoneOtp = async (req: Request, res: Response) => {
  const { phone } = req.body || {};

  if (!phone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_REQUIRED });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_PHONE });
  }

  // Check if phone already registered
  const { getUserByPhone } = require("../services/auth.service");
  const existing = await getUserByPhone(normalizedPhone);
  if (existing) {
    return res
      .status(409)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_ALREADY_REGISTERED });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to database
  const { createPhoneOtp } = require("../services/auth.service");
  await createPhoneOtp(normalizedPhone, otp, 10);

  // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
  console.log(`OTP for ${normalizedPhone}: ${otp}`);

  return res.json({
    success: true,
    message: SUCCESS_MESSAGES.OTP_SENT,
    // Remove in production - only for development
    ...(process.env.NODE_ENV === "development" && { otp }),
  });
};

// Step 2: Verify OTP
export const verifyPhoneOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body || {};

  if (!phone || !otp) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_AND_OTP_REQUIRED });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_PHONE });
  }

  const {
    verifyPhoneOtp: verifyOtpService,
  } = require("../services/auth.service");
  const verified = await verifyOtpService(normalizedPhone, otp);

  if (!verified) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP });
  }

  return res.json({
    success: true,
    message: SUCCESS_MESSAGES.PHONE_VERIFIED,
  });
};

// Step 3: Complete registration with other details (no password needed)
export const completeRegistration = async (req: Request, res: Response) => {
  const { phone, email, firstName, lastName, address, role } = req.body || {};

  if (!phone || !email || !firstName || !lastName) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_PHONE });
  }

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_EMAIL });
  }

  // Verify that phone OTP was verified
  const {
    isPhoneVerified,
    getUserByPhone,
    deletePhoneOtpRecords,
  } = require("../services/auth.service");
  const phoneVerified = await isPhoneVerified(normalizedPhone);
  if (!phoneVerified) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_NOT_VERIFIED });
  }

  // Check if phone already registered
  const existingPhone = await getUserByPhone(normalizedPhone);
  if (existingPhone) {
    return res
      .status(409)
      .json({ success: false, error: ERROR_MESSAGES.PHONE_ALREADY_REGISTERED });
  }

  // Check if email already registered
  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    return res
      .status(409)
      .json({ success: false, error: ERROR_MESSAGES.EMAIL_ALREADY_IN_USE });
  }

  // Validate role
  let allowed: string[] = [];
  try {
    allowed = await getAllRoles();
  } catch (e) {
    console.error("Error fetching roles for registration", e);
    return res
      .status(500)
      .json({ success: false, error: "Unable to validate role" });
  }

  const selectedRole = role ? String(role) : allowed[0] || "parent";
  if (!allowed.includes(selectedRole)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_ROLE });
  }

  // No password needed - phone OTP is the authentication
  const newUser = {
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: normalizedPhone,
    address: address || undefined,
    role: selectedRole,
    emailVerified: false,
    phoneVerified: true,
    createdAt: new Date(),
  };

  const result = await createUser(newUser as any);
  const userId = result.insertedId ? result.insertedId.toString() : undefined;

  // Clean up OTP records
  await deletePhoneOtpRecords(normalizedPhone);

  // Sign access token
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
        phone: normalizedPhone,
        role: selectedRole,
        emailVerified: false,
        phoneVerified: true,
      },
    },
    message: SUCCESS_MESSAGES.REGISTRATION_COMPLETED,
  });
};

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, address, role } =
    req.body || {};

  if (!email || !password || !firstName || !lastName || !phone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS });
  }

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_EMAIL });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_PASSWORD_FORMAT,
    });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_PHONE });
  }

  // check duplicate
  const existing = await getUserByEmail(email);
  if (existing) {
    return res
      .status(409)
      .json({ success: false, error: ERROR_MESSAGES.EMAIL_ALREADY_IN_USE });
  }

  // validate role (fetch allowed roles from DB)
  let allowed: string[] = [];
  try {
    allowed = await getAllRoles();
  } catch (e) {
    console.error("Error fetching roles for registration", e);
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.UNABLE_TO_VALIDATE_ROLE });
  }

  const selectedRole = role ? String(role) : allowed[0] || "parent";
  if (!allowed.includes(selectedRole)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_ROLE });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // create verification token
  const tempPayload = { userId: email, email, role: selectedRole };
  const verificationToken = signEmailToken(tempPayload, "7d");

  const newUser = {
    firstName,
    lastName,
    email: email.toLowerCase(),
    passwordHash,
    phone: normalizedPhone,
    address: address || undefined,
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
    message: SUCCESS_MESSAGES.REGISTRATION_EMAIL_SENT,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const ip = req.ip;
  console.log(email, password);
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.MISSING_EMAIL_OR_PASSWORD,
    });
  }

  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.INVALID_EMAIL });
  }

  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    recordFailedLogin(email || ip);
    console.warn(`Failed login attempt for ${email} from ${ip}`);
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      },
    });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    recordFailedLogin(email || ip);
    console.warn(`Failed login attempt for ${email} from ${ip}`);
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
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
      message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
    });
  }

  try {
    const user = await getUserByEmail(email);
    // Always return same response for privacy
    if (!user) {
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await createOtpForEmail(email, otp, 10);
    await sendPasswordResetOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
    });
  } catch (e) {
    console.error("forgotPassword error", e);
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body || {};
  if (!email || !otp || !validateEmail(email) || typeof otp !== "string") {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.MISSING_EMAIL_OR_OTP });
  }

  try {
    const resetToken = await verifyOtpAndCreateResetToken(email, otp);
    if (!resetToken)
      return res
        .status(400)
        .json({ success: false, error: ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP });
    return res.json({ success: true, data: { resetToken } });
  } catch (e) {
    console.error("verifyOtp error", e);
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body || {};
  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.MISSING_RESET_TOKEN_OR_PASSWORD,
    });
  }

  if (!validatePassword(newPassword)) {
    return res
      .status(400)
      .json({ success: false, error: ERROR_MESSAGES.PASSWORD_REQUIREMENTS });
  }

  try {
    const email = await consumeResetToken(resetToken);
    if (!email)
      return res
        .status(400)
        .json({ success: false, error: ERROR_MESSAGES.INVALID_RESET_TOKEN });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, passwordHash);

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS,
    });
  } catch (e) {
    console.error("resetPassword error", e);
    return res
      .status(500)
      .json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};
