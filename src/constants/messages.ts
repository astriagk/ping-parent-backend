export const SUCCESS_MESSAGES_COMMON = {
  RESOURCE_CREATED: "Resource created successfully",
};

export const ERROR_MESSAGES = {
  COMMON: {
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    RESOURCE_NOT_FOUND: "Resource not found",
    RESOURCE_ALREADY_EXISTS: "Resource already exists",
    VALIDATION_ERROR: "Validation error",
    INTERNAL_SERVER_ERROR: "Internal server error",
    RATE_LIMIT_EXCEEDED: "Too many login attempts. Try again later.",
  },
  AUTH: {
    MISSING_AUTH_HEADER: "Authorization header missing",
    MALFORMED_AUTH_HEADER: "Token missing from authorization header",
    USER_NOT_FOUND: "User not found",
    INVALID_REFRESH_TOKEN: "Invalid refresh token",
    TOKEN_EXPIRED: "Token expired",
    INVALID_TOKEN: "Invalid or expired token",
    PARENT_ROLE_REQUIRED: "Access denied. Parent role required.",
    DRIVER_ROLE_REQUIRED: "Access denied. Driver role required.",
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
  STUDENT: {
    NOT_FOUND: "Student not found",
    FAILED_TO_CREATE: "Failed to create student",
    FAILED_TO_UPDATE: "Failed to update student",
    FAILED_TO_DELETE: "Failed to delete student",
    NAME_REQUIRED: "Student name is required",
    PARENT_ID_REQUIRED: "Parent ID is required",
    SCHOOL_ID_REQUIRED: "School ID is required",
    CLASS_REQUIRED: "Class is required",
    PICKUP_ADDRESS_ID_REQUIRED: "Pickup address ID is required",
    INVALID_GENDER: "Gender must be male, female, or other",
    ALREADY_EXISTS:
      "A student with the same name, school, and class already exists for this parent",
  },
  SCHOOL: {
    NOT_FOUND: "School not found",
    FAILED_TO_CREATE: "Failed to create school",
    FAILED_TO_UPDATE: "Failed to update school",
    FAILED_TO_DELETE: "Failed to delete school",
    NAME_REQUIRED: "School name is required",
    ADDRESS_REQUIRED: "School address is required",
    CITY_REQUIRED: "City is required",
    STATE_REQUIRED: "State is required",
    COORDINATES_REQUIRED: "Latitude and longitude are required",
    ALREADY_EXISTS: "A school with the same name and city already exists",
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
  STUDENT: {
    CREATED_SUCCESSFULLY: "Student created successfully",
    UPDATED_SUCCESSFULLY: "Student updated successfully",
    DELETED_SUCCESSFULLY: "Student deleted successfully",
    FETCHED_SUCCESSFULLY: "Student fetched successfully",
    LIST_FETCHED_SUCCESSFULLY: "Students list fetched successfully",
  },
  SCHOOL: {
    CREATED_SUCCESSFULLY: "School created successfully",
    UPDATED_SUCCESSFULLY: "School updated successfully",
    DELETED_SUCCESSFULLY: "School deleted successfully",
    FETCHED_SUCCESSFULLY: "School fetched successfully",
    LIST_FETCHED_SUCCESSFULLY: "Schools list fetched successfully",
  },
};

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
};
