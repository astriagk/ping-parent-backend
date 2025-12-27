export const VALIDATION_MESSAGES = {
  EMAIL: {
    INVALID: "Please provide a valid email address",
    REQUIRED: "Email is required",
  },
  PASSWORD: {
    MIN_LENGTH: "Password must be at least 8 characters long",
    PATTERN:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    REQUIRED: "Password is required",
    NEW_REQUIRED: "New password is required",
    CURRENT_REQUIRED: "Current password is required",
  },
  ROLE: {
    INVALID: "Role must be either 'parent' or 'driver'",
    REQUIRED: "Role is required",
  },
  PHONE: {
    INVALID: "Please provide a valid phone number",
    REQUIRED: "Phone number is required",
  },
  OTP: {
    LENGTH: "OTP must be 6 digits",
    REQUIRED: "OTP is required",
  },
  TOKEN: {
    RESET_REQUIRED: "Reset token is required",
    VERIFICATION_REQUIRED: "Verification token is required",
  },
  NAME: {
    FIRST_MIN: "First name must be at least 2 characters long",
    FIRST_MAX: "First name cannot exceed 50 characters",
    LAST_MIN: "Last name must be at least 2 characters long",
    LAST_MAX: "Last name cannot exceed 50 characters",
  },
};
