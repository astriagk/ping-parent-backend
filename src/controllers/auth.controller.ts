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

export const verifyAuthToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Malformed Authorization header" });
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
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
          return res
            .status(401)
            .json({ success: false, error: "Invalid refresh token" });
        }
      }

      return res.status(401).json({ success: false, error: "Token expired" });
    }

    return res.status(401).json({ success: false, error: "Invalid token" });
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
      .json({ success: false, error: "Failed to fetch roles" });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, address, role } =
    req.body || {};

  if (!email || !password || !firstName || !lastName || !phone) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, error: "Invalid email" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      error:
        "Password must be at least 8 characters and include uppercase, lowercase and a number",
    });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ success: false, error: "Invalid phone" });
  }

  // check duplicate
  const existing = await getUserByEmail(email);
  if (existing) {
    return res
      .status(409)
      .json({ success: false, error: "Email already in use" });
  }

  // validate role (fetch allowed roles from DB)
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
    return res.status(400).json({ success: false, error: "Invalid role" });
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
    message:
      "Registration successful. Please check your email to verify your account.",
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const ip = req.ip;
  console.log(email, password);
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Missing email or password" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, error: "Invalid email" });
  }

  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    recordFailedLogin(email || ip);
    console.warn(`Failed login attempt for ${email} from ${ip}`);
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect",
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
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect",
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
    return res
      .status(200)
      .json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset code.",
      });
  }

  try {
    const user = await getUserByEmail(email);
    // Always return same response for privacy
    if (!user) {
      return res
        .status(200)
        .json({
          success: true,
          message:
            "If an account exists with this email, you will receive a password reset code.",
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await createOtpForEmail(email, otp, 10);
    await sendPasswordResetOTP(email, otp);

    return res
      .status(200)
      .json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset code.",
      });
  } catch (e) {
    console.error("forgotPassword error", e);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body || {};
  if (!email || !otp || !validateEmail(email) || typeof otp !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Missing email or otp" });
  }

  try {
    const resetToken = await verifyOtpAndCreateResetToken(email, otp);
    if (!resetToken)
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired OTP" });
    return res.json({ success: true, data: { resetToken } });
  } catch (e) {
    console.error("verifyOtp error", e);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body || {};
  if (!resetToken || !newPassword) {
    return res
      .status(400)
      .json({ success: false, error: "Missing resetToken or newPassword" });
  }

  if (!validatePassword(newPassword)) {
    return res
      .status(400)
      .json({ success: false, error: "Password does not meet requirements" });
  }

  try {
    const email = await consumeResetToken(resetToken);
    if (!email)
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired reset token" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, passwordHash);

    return res.json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (e) {
    console.error("resetPassword error", e);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
