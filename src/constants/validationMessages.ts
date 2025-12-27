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
    MAX: "Name cannot exceed 100 characters",
    REQUIRED: "Name is required",
  },
  PHOTO_URL: {
    INVALID: "Photo URL must be a valid URL",
  },
  ADDRESS: {
    LINE1_REQUIRED: "Address line 1 is required",
    LINE1_MAX: "Address line 1 cannot exceed 200 characters",
    LINE2_MAX: "Address line 2 cannot exceed 200 characters",
    CITY_REQUIRED: "City is required",
    CITY_MAX: "City cannot exceed 100 characters",
    STATE_REQUIRED: "State is required",
    STATE_MAX: "State cannot exceed 100 characters",
    PINCODE_PATTERN: "Pincode must be 5-10 digits",
  },
  LATITUDE: {
    INVALID: "Latitude must be a valid number",
    RANGE: "Latitude must be between -90 and 90",
    REQUIRED: "Latitude is required",
  },
  LONGITUDE: {
    INVALID: "Longitude must be a valid number",
    RANGE: "Longitude must be between -180 and 180",
    REQUIRED: "Longitude is required",
  },
  VEHICLE: {
    TYPE_INVALID: "Vehicle type must be van, auto, or bus",
    TYPE_REQUIRED: "Vehicle type is required",
    NUMBER_REQUIRED: "Vehicle number is required",
    NUMBER_MAX: "Vehicle number cannot exceed 20 characters",
    CAPACITY_INVALID: "Vehicle capacity must be a number",
    CAPACITY_INTEGER: "Vehicle capacity must be an integer",
    CAPACITY_MIN: "Vehicle capacity must be at least 1",
    CAPACITY_MAX: "Vehicle capacity cannot exceed 100",
    CAPACITY_REQUIRED: "Vehicle capacity is required",
  },
  DRIVER_DOCUMENTS: {
    DRIVING_LICENSE_NUMBER_REQUIRED: "Driving license number is required",
    DRIVING_LICENSE_NUMBER_MAX:
      "Driving license number cannot exceed 50 characters",
    DRIVING_LICENSE_PHOTO_INVALID:
      "Driving license photo URL must be a valid URL",
    VEHICLE_LICENSE_NUMBER_REQUIRED: "Vehicle license number is required",
    VEHICLE_LICENSE_NUMBER_MAX:
      "Vehicle license number cannot exceed 50 characters",
    VEHICLE_LICENSE_PHOTO_INVALID:
      "Vehicle license photo URL must be a valid URL",
    INSURANCE_NUMBER_MAX: "Insurance number cannot exceed 50 characters",
    INSURANCE_PHOTO_INVALID: "Insurance photo URL must be a valid URL",
  },
};
