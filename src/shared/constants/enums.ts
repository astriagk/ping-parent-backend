export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}
export enum UserRole {
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
  SCHOOL_ADMIN = "school_admin",
  PARENT = "parent",
  DRIVER = "driver",
}

export enum VehicleType {
  VAN = "van",
  AUTO = "auto",
  BUS = "bus",
}

export const VehicleTypesArray = [
  VehicleType.VAN,
  VehicleType.AUTO,
  VehicleType.BUS,
];

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
  LOCATION = "LOC",
}

export enum AssignmentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  PARENT_REQUESTED = "parent_requested",
  REJECTED = "rejected",
}

export enum AssignmentSource {
  PARENT = "parent",
  SCHOOL_ADMIN = "school_admin",
  SYSTEM = "system",
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

export enum PricingModel {
  FLAT = "flat",
  PER_KID = "per_kid",
  BASE_PLUS_PER_KID = "base_plus_per_kid",
}

export enum PlanBadgeType {
  BEST_VALUE = "best_value",
  POPULAR = "popular",
  RECOMMENDED = "recommended",
  LIMITED_OFFER = "limited_offer",
  CUSTOM = "custom",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  UPGRADED = "upgraded",
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

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AuditAction {
  SUCCESS = "success",
  FAILURE = "failure",
}

export enum SchoolSubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

export enum DriverSocketEvent {
  SUBSCRIBE_TRIP = "driver:subscribe_trip",
  UNSUBSCRIBE_TRIP = "driver:unsubscribe_trip",
  UPDATE_POSITION = "driver:update_position",
  TRIP_STARTED = "driver:trip_started",
  TRIP_COMPLETED = "driver:trip_completed",
  STUDENT_PICKED = "driver:student_picked",
  STUDENT_DROPPED = "driver:student_dropped",
  APPROACHING_WAYPOINT = "driver:approaching_waypoint",
}

export enum ParentSocketEvent {
  SUBSCRIBE_TRIP = "parent:subscribe_trip",
  UNSUBSCRIBE_TRIP = "parent:unsubscribe_trip",
}

// Events sent to specific parent only (not broadcast to all trip subscribers)
export enum ParentNotificationEvent {
  MY_STUDENT_PICKED = "parent:my_student_picked",
  MY_STUDENT_DROPPED = "parent:my_student_dropped",
  MY_STUDENT_APPROACHING = "parent:my_student_approaching",
  MY_STUDENT_ABSENT = "parent:my_student_absent",
}

export enum BroadcastSocketEvent {
  POSITION_UPDATE = "trip:position_update",
  TRIP_STARTED = "trip:started",
  TRIP_COMPLETED = "trip:completed",
  TRIP_STATUS_UPDATE = "trip:status_update",
  ROUTE_CALCULATED = "trip:route_calculated",
  APPROACHING = "trip:approaching",
  STUDENT_PICKED = "trip:student_picked",
  STUDENT_DROPPED = "trip:student_dropped",
  ERROR = "socket:error",
}

// Room types for socket.io
export enum SocketRoom {
  TRIP = "trip", // trip:{tripId} - shared room for driver and parents on a trip
  TRIP_DRIVER = "driver", // trip:{tripId} - for driver of a trip
  PARENT = "parent", // parent:{parentId} - for sending to specific parent
}
