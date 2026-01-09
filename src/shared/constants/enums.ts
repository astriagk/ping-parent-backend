export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}
export enum UserRole {
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
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
  DRIVER = "DRV",
  SCHOOL = "SCH",
  STUDENT = "STU",
  USER = "USR",
  DRIVER_STUDENT_ASSIGNMENT = "DSA",
  TRIP = "TRP",
  TRIP_STUDENT = "TPS",
  DAILY_QR_OTP = "DQO",
  SUBSCRIPTION_PLAN = "SPL",
  PAYMENT = "PAY",
  ADMIN = "ADM",
  ROLE = "ROL",
  AUDIT_LOG = "AUL",
}

export enum AssignmentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  PARENT_REQUESTED = "parent_requested",
  REJECTED = "rejected",
}

export enum TripType {
  PICKUP = "pickup",
  DROP = "drop",
}

export enum TripStatus {
  SCHEDULED = "scheduled",
  STARTED = "started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  PENDING = "pending",
}

export enum PickupStatus {
  PENDING = "pending",
  PICKED = "picked",
  DROPPED = "dropped",
  NO_SHOW = "no_show",
}

export enum NotificationType {
  PICKUP_STARTED = "pickup_started",
  APPROACHING = "approaching",
  PICKED_UP = "picked_up",
  DROPPED = "dropped",
  PAYMENT_DUE = "payment_due",
  GENERAL = "general",
}

export enum PlanType {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum PaymentType {
  SUBSCRIPTION = "subscription",
  PENALTY = "penalty",
}

export enum PaymentMethod {
  CARD = "card",
  UPI = "upi",
  NETBANKING = "netbanking",
  WALLET = "wallet",
  CASH = "cash",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum AdminRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AuditAction {
  SUCCESS = "success",
  FAILURE = "failure",
}
