export enum UserRole {
  ADMIN = "admin",
  PARENT = "parent",
  DRIVER = "driver",
}

export enum VehicleType {
  VAN = "van",
  AUTO = "auto",
  BUS = "bus",
}

export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh",
  RESET_PASSWORD = "resetPassword",
  VERIFY_EMAIL = "verifyEmail",
}

export enum OTPPurpose {
  PHONE_VERIFICATION = "phoneVerification",
  LOGIN = "login",
}

export enum AlphabetType {
  Alphanumeric = "alphanumeric",
  Uppercase = "uppercase",
  Lowercase = "lowercase",
  Numbers = "numbers",
}

export enum UniqueCodeTypes {
  SCHOOL = "SCH",
  STUDENT = "STU",
  USER = "USR",
  DRIVER_STUDENT_ASSIGNMENT = "DSA",
}

export enum AssignmentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  PARENT_REQUESTED = "parent_requested",
  REJECTED = "rejected",
}
