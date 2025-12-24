// Error Messages
export const ERROR_MESSAGES = {
  // Auth Token Errors
  MISSING_AUTH_HEADER: "Missing Authorization header",
  MALFORMED_AUTH_HEADER: "Malformed Authorization header",
  USER_NOT_FOUND: "User not found",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  TOKEN_EXPIRED: "Token expired",
  INVALID_TOKEN: "Invalid token",

  // Role Errors
  FAILED_TO_FETCH_ROLES: "Failed to fetch roles",
  UNABLE_TO_VALIDATE_ROLE: "Unable to validate role",
  INVALID_ROLE: "Invalid role",

  // Phone Registration Errors
  PHONE_REQUIRED: "Phone number is required",
  INVALID_PHONE: "Invalid phone number",
  PHONE_ALREADY_REGISTERED: "Phone number already registered",
  PHONE_AND_OTP_REQUIRED: "Phone number and OTP are required",
  INVALID_OR_EXPIRED_OTP: "Invalid or expired OTP",
  PHONE_NOT_VERIFIED: "Phone number not verified. Please verify OTP first.",
  PHONE_NOT_REGISTERED: "Phone number not registered",
  PHONE_LOGIN_OTP_REQUIRED: "Phone number and OTP are required for login",

  // General Registration/Login Errors
  MISSING_REQUIRED_FIELDS: "Missing required fields",
  INVALID_EMAIL: "Invalid email",
  EMAIL_ALREADY_IN_USE: "Email already in use",
  INVALID_PASSWORD_FORMAT:
    "Password must be at least 8 characters and include uppercase, lowercase and a number",
  MISSING_EMAIL_OR_PASSWORD: "Missing email or password",
  INVALID_CREDENTIALS: "Email or password is incorrect",
  PASSWORD_REQUIREMENTS: "Password does not meet requirements",

  // Password Reset Errors
  MISSING_EMAIL_OR_OTP: "Missing email or otp",
  MISSING_RESET_TOKEN_OR_PASSWORD: "Missing resetToken or newPassword",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",

  // Server Errors
  SERVER_ERROR: "Server error",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  OTP_SENT: "OTP sent to phone number",
  LOGIN_OTP_SENT: "Login OTP sent to phone number",
  PHONE_VERIFIED: "Phone number verified successfully",
  LOGIN_SUCCESSFUL: "Login successful",
  REGISTRATION_COMPLETED: "Registration completed successfully",
  REGISTRATION_EMAIL_SENT:
    "Registration successful. Please check your email to verify your account.",
  PASSWORD_RESET_EMAIL_SENT:
    "If an account exists with this email, you will receive a password reset code.",
  PASSWORD_RESET_SUCCESS:
    "Password reset successful. You can now login with your new password.",
  LOGGED_OUT_SUCCESSFULLY: "Logged out successfully",
};

// Error Codes
export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
};
