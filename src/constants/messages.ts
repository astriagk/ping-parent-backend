export const ERROR_MESSAGES = {
  AUTH: {
    MISSING_AUTH_HEADER: "Missing Authorization header",
    MALFORMED_AUTH_HEADER: "Malformed Authorization header",
    USER_NOT_FOUND: "User not found",
    INVALID_REFRESH_TOKEN: "Invalid refresh token",
    TOKEN_EXPIRED: "Token expired",
    INVALID_TOKEN: "Invalid token",
    FAILED_TO_FETCH_ROLES: "Failed to fetch roles",
    UNABLE_TO_VALIDATE_ROLE: "Unable to validate role",
    INVALID_ROLE: "Invalid role",
    MISSING_REQUIRED_FIELDS: "Missing required fields",
    INVALID_EMAIL: "Invalid email",
    EMAIL_ALREADY_IN_USE: "Email already in use",
    INVALID_PASSWORD_FORMAT:
      "Password must be at least 8 characters and include uppercase, lowercase and a number",
    MISSING_EMAIL_OR_PASSWORD: "Missing email or password",
    INVALID_CREDENTIALS: "Email or password is incorrect",
    PASSWORD_REQUIREMENTS: "Password does not meet requirements",
    MISSING_EMAIL_OR_OTP: "Missing email or otp",
    MISSING_RESET_TOKEN_OR_PASSWORD: "Missing resetToken or newPassword",
    INVALID_RESET_TOKEN: "Invalid or expired reset token",
    SERVER_ERROR: "Server error",
    LOGGED_OUT: "Logged out successfully",
  },
  PHONE: {
    PHONE_REQUIRED: "Phone number is required",
    INVALID_PHONE: "Invalid phone number",
    PHONE_ALREADY_REGISTERED: "Phone number already registered",
    PHONE_AND_OTP_REQUIRED: "Phone number and OTP are required",
    INVALID_OR_EXPIRED_OTP: "Invalid or expired OTP",
    PHONE_NOT_REGISTERED: "Phone number not registered",
    PHONE_LOGIN_OTP_REQUIRED: "Phone number and OTP are required for login",
  },
  PARENT: {
    USER_NOT_AUTHENTICATED: "User not authenticated",
    PARENT_PROFILE_NOT_FOUND: "Parent profile not found",
    PARENT_PROFILE_NOT_FOUND_OR_NO_CHANGES:
      "Parent profile not found or no changes made",
    NO_UPDATES_PROVIDED: "No updates provided",
    FAILED_TO_FETCH_PARENT_PROFILE: "Failed to fetch parent profile",
    FAILED_TO_UPDATE_PARENT_PROFILE: "Failed to update parent profile",
  },
  ADDRESS: {
    ADDRESS_FIELDS_REQUIRED: "Street, city, state, and zipCode are required",
    ADDRESS_NOT_FOUND: "Address not found",
    INVALID_COORDINATES:
      "Latitude and longitude are required and must be valid numbers",
    FAILED_TO_FETCH_ADDRESS: "Failed to fetch address",
    FAILED_TO_UPDATE_ADDRESS: "Failed to update address",
  },
  DRIVER: {
    USER_NOT_AUTHENTICATED: "User not authenticated",
    DRIVER_PROFILE_NOT_FOUND: "Driver profile not found",
    NO_UPDATES_PROVIDED: "No updates provided",
    REQUIRED_FIELDS_MISSING: "Required fields are missing",
    INVALID_VEHICLE_TYPE: "Vehicle type must be van, auto, or bus",
    INVALID_VEHICLE_CAPACITY: "Vehicle capacity must be a positive number",
    INVALID_COORDINATES:
      "Latitude and longitude are required and must be valid numbers",
    FAILED_TO_FETCH_DRIVER_PROFILE: "Failed to fetch driver profile",
    FAILED_TO_UPDATE_DRIVER_PROFILE: "Failed to update driver profile",
    FAILED_TO_CREATE_DRIVER_PROFILE: "Failed to create driver profile",
    ADDRESS_NOT_FOUND: "Driver address not found",
    FAILED_TO_FETCH_ADDRESS: "Failed to fetch driver address",
    FAILED_TO_UPDATE_ADDRESS: "Failed to update driver address",
    DOCUMENTS_NOT_FOUND: "Driver documents not found",
    FAILED_TO_FETCH_DOCUMENTS: "Failed to fetch driver documents",
    FAILED_TO_UPDATE_DOCUMENTS: "Failed to update driver documents",
  },
};

export const SUCCESS_MESSAGES = {
  AUTH: {
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
  },
  PHONE: {
    OTP_SENT: "OTP sent to phone number",
    LOGIN_OTP_SENT: "Login OTP sent to phone number",
    PHONE_VERIFIED_SUCCESSFULLY: "Phone number verified successfully",
  },
  PARENT: {
    PROFILE_UPDATED_SUCCESSFULLY: "Profile updated successfully",
  },
  ADDRESS: {
    ADDRESS_UPDATED_SUCCESSFULLY: "Address updated successfully",
  },
  DRIVER: {
    PROFILE_UPDATED_SUCCESSFULLY: "Driver profile updated successfully",
    PROFILE_CREATED_SUCCESSFULLY: "Driver profile created successfully",
    ADDRESS_UPDATED_SUCCESSFULLY: "Driver address updated successfully",
    DOCUMENTS_UPDATED_SUCCESSFULLY: "Driver documents updated successfully",
  },
};

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
};
