export const SUCCESS_MESSAGES_COMMON = {
  LIST_FETCHED: "List fetched successfully",
  RESOURCE_ACTION_FAILED: "Resource action failed",
  RESOURCE_CREATED: "Resource created successfully",
  RESOURCE_DELETED: "Resource deleted successfully",
  RESOURCE_FETCHED: "Resource fetched successfully",
  RESOURCE_UPDATED: "Resource updated successfully",
};

export const ERROR_MESSAGES = {
  ADMIN: {
    NOT_FOUND: "Admin not found",
    EMAIL_ALREADY_EXISTS: "Admin with this email already exists",
    USERNAME_ALREADY_EXISTS: "Admin with this username already exists",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_REQUIRED: "Email is required",
    PASSWORD_REQUIRED: "Password is required",
    USERNAME_REQUIRED: "Username is required",
    ONLY_SUPERADMIN_CAN_CREATE: "Only superadmin can create new admins",
    CANNOT_MODIFY_SUPERADMIN: "Cannot modify superadmin account",
    ADMIN_ROLE_REQUIRED: "Admin role is required",
    INVALID_ADMIN_ROLE: "Admin role must be admin or superadmin",
    INVALID_APPROVAL_STATUS:
      "Invalid approval status. Must be 'pending', 'approved', or 'rejected'",
    REJECTION_REASON_REQUIRED:
      "Rejection reason is required when rejecting an admin",
  },
  ADDRESS: {
    ADDRESS_FIELDS_REQUIRED: "Street, city, state, and zipCode are required",
    ADDRESS_NOT_FOUND: "Address not found",
    INVALID_COORDINATES:
      "Latitude and longitude are required and must be valid numbers",
    FAILED_TO_FETCH_ADDRESS: "Failed to fetch address",
  },
  AUDIT_LOG: {
    NOT_FOUND: "Audit log not found",
    FAILED_TO_FETCH: "Failed to fetch audit logs",
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
    ADMIN_ROLE_REQUIRED: "Access denied. Admin role required.",
    ADMIN_OR_ABOVE_ROLE_REQUIRED:
      "Access denied. Admin or superadmin role required.",
    SUPERADMIN_ROLE_REQUIRED: "Access denied. Superadmin role required.",
    SCHOOL_ADMIN_ROLE_REQUIRED: "Access denied. School admin role required.",
    FAILED_TO_FETCH_ROLES: "Failed to fetch roles",
    UNABLE_TO_VALIDATE_ROLE: "Unable to validate role",
    USER_DEACTIVATED:
      "Your account has been deactivated. Please contact support.",
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
  COMMON: {
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    RESOURCE_NOT_FOUND: "Resource not found",
    RESOURCE_ALREADY_EXISTS: "Resource already exists",
    VALIDATION_ERROR: "Validation error",
    INTERNAL_SERVER_ERROR: "Internal server error",
    RATE_LIMIT_EXCEEDED: "Too many login attempts. Try again later.",
    CREATE_FAILED: "Failed to create resource",
    UPDATE_FAILED: "Failed to update resource",
    DELETE_FAILED: "Failed to delete resource",
  },
  DAILY_QR_OTP: {
    NOT_FOUND: "QR code/OTP not found",
    FAILED_TO_GENERATE: "Failed to generate QR code/OTP",
    STUDENT_ID_REQUIRED: "Student ID is required",
    TRIP_ID_REQUIRED: "Trip ID is required",
    TRIP_TYPE_REQUIRED: "Trip type is required",
    INVALID_TRIP_TYPE: "Trip type must be pickup or drop",
    ALREADY_EXISTS: "QR code/OTP already generated for this trip and student",
    EXPIRED: "QR code/OTP has expired",
    ALREADY_USED: "QR code/OTP has already been used",
    INVALID: "Invalid QR code or OTP",
    NOT_VALID_YET: "QR code/OTP is not valid yet",
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
    ADDRESS_NOT_FOUND: "Driver address not found",
    FAILED_TO_FETCH_ADDRESS: "Failed to fetch driver address",
    DOCUMENTS_NOT_FOUND: "Driver documents not found",
    FAILED_TO_FETCH_DOCUMENTS: "Failed to fetch driver documents",
    DETAILS_NOT_FOUND: "Driver details not found",
  },
  DRIVER_STUDENT_ASSIGNMENT: {
    NOT_FOUND: "Driver-student assignment not found",
    DRIVER_ID_REQUIRED: "Driver ID is required",
    STUDENT_ID_REQUIRED: "Student ID is required",
    DRIVER_UNIQUE_ID_REQUIRED: "Driver unique ID is required",
    ASSIGNED_DATE_REQUIRED: "Assigned date is required",
    INVALID_ASSIGNMENT_STATUS:
      "Assignment status must be active, inactive, pending, or parent_requested",
    ALREADY_EXISTS:
      "An assignment for this driver and student combination already exists",
    DRIVER_NOT_FOUND: "Driver not found",
    STUDENT_NOT_FOUND: "Student not found for this assignment",
    INVALID_MONTHLY_FEE: "Monthly fee must be a positive number",
    INVALID_DATE_RANGE: "End date must be after start date",
    ASSIGNMENT_ALREADY_ACTIVE: "This assignment is already active",
    ASSIGNMENT_NOT_PENDING: "Only pending assignments can be approved",
    CREATOR_CANNOT_APPROVE: "You cannot approve an assignment you created.",
    CANNOT_REJECT:
      "Only pending or parent-requested assignments can be rejected",
    CANNOT_REASSIGN:
      "Only active or parent-requested assignments can be reassigned",
    SAME_DRIVER: "New driver is the same as the current driver",
    STUDENT_NOT_OWNED: "You do not have permission to modify this assignment",
  },
  FILE_UPLOAD: {
    FOLDER_PATH_REQUIRED: "Folder path is required as query parameter",
    NO_FILE_UPLOADED:
      "No file uploaded. Please provide a file in the 'file' field",
    FILE_EMPTY: "File is empty",
    OLD_FILE_URL_REQUIRED: "Old file URL is required in request body",
  },
  NOTIFICATION: {
    NOT_FOUND: "Notification not found",
    FAILED_TO_FETCH: "Failed to fetch notifications",
    USER_ID_REQUIRED: "User ID is required",
    NOTIFICATION_TYPE_REQUIRED: "Notification type is required",
    TITLE_REQUIRED: "Title is required",
    MESSAGE_REQUIRED: "Message is required",
    INVALID_NOTIFICATION_TYPE:
      "Notification type must be pickup_started, approaching, picked_up, dropped, absent, trip_started, trip_completed, payment_due, or general",
    FCM_TOKEN_REQUIRED: "FCM token is required",
    DEVICE_TYPE_REQUIRED: "Device type is required",
    INVALID_DEVICE_TYPE: "Device type must be android, ios, or web",
  },
  PARENT: {
    USER_NOT_AUTHENTICATED: "User not authenticated",
    PARENT_PROFILE_NOT_FOUND: "Parent profile not found",
    PARENT_PROFILE_NOT_FOUND_OR_NO_CHANGES:
      "Parent profile not found or no changes made",
    NO_UPDATES_PROVIDED: "No updates provided",
    FAILED_TO_FETCH_PARENT_PROFILE: "Failed to fetch parent profile",
    DETAILS_NOT_FOUND: "Parent details not found",
  },
  PARENT_SUBSCRIPTION: {
    NOT_FOUND: "Parent subscription not found",
    PARENT_ID_REQUIRED: "Parent ID is required",
    PLAN_ID_REQUIRED: "Plan ID is required",
    START_DATE_REQUIRED: "Start date is required",
    END_DATE_REQUIRED: "End date is required",
    SUBSCRIPTION_STATUS_REQUIRED: "Subscription status is required",
    INVALID_SUBSCRIPTION_STATUS:
      "Subscription status must be active, expired, or cancelled",
    ALREADY_EXISTS: "An active subscription already exists for this parent",
    INVALID_DATE_RANGE: "End date must be after start date",
    PLAN_NOT_FOUND: "Subscription plan not found",
    PLAN_NOT_ACTIVE: "The selected subscription plan is not active",
    CANNOT_UPDATE_EXPIRED: "Cannot update an expired subscription",
    CANNOT_CANCEL_EXPIRED: "Cannot cancel an expired subscription",
    ALREADY_CANCELLED: "Subscription is already cancelled",
    NO_ACTIVE_STUDENTS: "No active students found for this parent",
    STUDENT_NOT_FOUND: "One or more students were not found",
    STUDENT_NOT_OWNED: "One or more students do not belong to this parent",
    STUDENT_NOT_ACTIVE: "One or more students are not active",
    STUDENT_ALREADY_SUBSCRIBED:
      "One or more students are already covered by an active subscription",
    STUDENT_COUNT_BELOW_MIN:
      "Number of students is below the plan's minimum requirement",
    STUDENT_COUNT_ABOVE_MAX:
      "Number of students exceeds the plan's maximum limit",
    NO_ACTIVE_SUBSCRIPTION_TO_UPGRADE:
      "No active subscription found to upgrade",
    CANNOT_UPGRADE_TO_SAME_PLAN:
      "Cannot upgrade to the same plan you already have",
    UPGRADE_NOT_ALLOWED_DOWNGRADE:
      "The selected plan is not an upgrade. The new plan price must be higher than your current plan",
  },
  PAYMENT: {
    NOT_FOUND: "Payment not found",
    FAILED_TO_FETCH: "Failed to fetch payment",
    PARENT_ID_REQUIRED: "Parent ID is required",
    PAYMENT_TYPE_REQUIRED: "Payment type is required",
    AMOUNT_REQUIRED: "Amount is required",
    PAYMENT_METHOD_REQUIRED: "Payment method is required",
    PAYMENT_STATUS_REQUIRED: "Payment status is required",
    INVALID_PAYMENT_TYPE: "Payment type must be subscription or penalty",
    INVALID_PAYMENT_METHOD:
      "Payment method must be card, upi, netbanking, wallet, or cash",
    INVALID_PAYMENT_STATUS:
      "Payment status must be pending, completed, failed, or refunded",
    INVALID_AMOUNT: "Amount must be a positive number",
    INVALID_CURRENCY: "Currency must be a valid 3-letter code",
    SUBSCRIPTION_NOT_FOUND: "Subscription not found",
    CANNOT_UPDATE_COMPLETED: "Cannot update a completed payment",
    CANNOT_REFUND_PENDING: "Cannot refund a pending payment",
    ALREADY_COMPLETED: "Payment is already completed",
    ALREADY_REFUNDED: "Payment has already been refunded",
  },
  PHONE: {
    PHONE_REQUIRED: "Phone number is required",
    INVALID_PHONE: "Invalid phone number",
    PHONE_ALREADY_REGISTERED: "Phone number already registered",
    PHONE_AND_OTP_REQUIRED: "Phone number and OTP are required",
    INVALID_OR_EXPIRED_OTP: "Invalid or expired OTP",
    PHONE_NOT_REGISTERED: "Phone number not registered",
    PHONE_LOGIN_OTP_REQUIRED: "Phone number and OTP are required for login",
    OTP_SENDING_FAILED: "Failed to send OTP. Please try again later.",
    OTP_VERIFICATION_FAILED: "OTP verification failed. Please try again.",
    LOGIN_OTP_SENDING_FAILED:
      "Failed to send login OTP. Please try again later.",
  },
  RATING_REVIEW: {
    NOT_FOUND: "Rating/review not found",
    FAILED_TO_FETCH: "Failed to fetch rating/review",
    PARENT_ID_REQUIRED: "Parent ID is required",
    DRIVER_ID_REQUIRED: "Driver ID is required",
    RATING_REQUIRED: "Rating is required",
    INVALID_RATING: "Rating must be between 1 and 5",
    ALREADY_EXISTS: "You have already submitted a rating/review for this trip",
    DRIVER_NOT_FOUND: "Driver not found",
    TRIP_NOT_FOUND: "Trip not found",
    UNAUTHORIZED_ACCESS: "You are not authorized to access this rating/review",
  },
  ROLE: {
    NOT_FOUND: "Role not found",
    ROLE_NAME_ALREADY_EXISTS: "Role with this name already exists",
    ROLE_NAME_REQUIRED: "Role name is required",
    CANNOT_DELETE_IN_USE:
      "Cannot delete role that is currently assigned to users",
  },
  SCHOOL: {
    NOT_FOUND: "School not found",
    NAME_REQUIRED: "School name is required",
    ADDRESS_REQUIRED: "School address is required",
    CITY_REQUIRED: "City is required",
    STATE_REQUIRED: "State is required",
    COORDINATES_REQUIRED: "Latitude and longitude are required",
    ALREADY_EXISTS: "A school with the same name and city already exists",
  },
  SCHOOL_ADMIN: {
    NOT_FOUND: "School admin not found",
    SCHOOL_ID_REQUIRED: "School ID is required",
    ADMIN_ID_REQUIRED: "Admin ID is required",
    ALREADY_EXISTS: "School admin with this email already exists",
    INACTIVE: "School admin account is inactive",
  },
  SCHOOL_DRIVER: {
    SCHOOL_ID_REQUIRED: "School ID is required",
    DRIVER_ID_REQUIRED: "Driver ID is required",
    DRIVER_ID_AND_SCHOOL_ID_REQUIRED: "Driver ID and School ID are required",
    DRIVER_NOT_FOUND: "Driver not found",
    CAPACITY_REACHED: "School has reached maximum driver capacity ({capacity})",
  },
  SCHOOL_SUBSCRIPTION: {
    NOT_FOUND: "School subscription not found",
    NO_ACTIVE_SUBSCRIPTION: "No active subscription found for school",
    SCHOOL_ID_REQUIRED: "School ID is required",
    SUBSCRIPTION_ID_REQUIRED: "Subscription ID is required",
  },
  SOCKET: {
    MISSING_AUTH_CREDENTIALS: "Missing authentication credentials",
    INVALID_ROLE: "Invalid role",
    USER_ID_MISMATCH: "User ID mismatch",
    ROLE_MISMATCH: "Role mismatch",
    INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token",
    ONLY_DRIVERS_CAN_SUBSCRIBE: "Only drivers can subscribe as driver",
    ONLY_PARENTS_CAN_SUBSCRIBE: "Only parents can subscribe as parent",
    NOT_AUTHORIZED_TO_ACCESS_TRIP: "Not authorized to access this trip",
    NOT_AUTHORIZED_TO_TRACK_TRIP: "Not authorized to track this trip",
    INVALID_COORDINATES: "Invalid coordinates",
    RATE_LIMITED: "Position update rate limited",
  },
  STUDENT: {
    NOT_FOUND: "Student not found",
    NAME_REQUIRED: "Student name is required",
    PARENT_ID_REQUIRED: "Parent ID is required",
    SCHOOL_ID_REQUIRED: "School ID is required",
    CLASS_REQUIRED: "Class is required",
    PICKUP_ADDRESS_ID_REQUIRED: "Pickup address ID is required",
    INVALID_GENDER: "Gender must be male, female, or other",
    ALREADY_EXISTS:
      "A student with the same name, school, and class already exists for this parent",
  },
  SUBSCRIPTION: {
    PLAN_NOT_FOUND: "Subscription plan not found",
    NOT_FOUND: "Subscription not found",
    INVALID_OR_EXPIRED_CODE: "Invalid or expired subscription code",
    CODE_ALREADY_REDEEMED: "Subscription code already redeemed",
    PARENT_NOT_FOUND: "Parent not found",
    ALREADY_ACTIVE: "Parent already has an active subscription",
  },
  SUBSCRIPTION_PLAN: {
    NOT_FOUND: "Subscription plan not found",
    FAILED_TO_FETCH: "Failed to fetch subscription plans",
    PLAN_NAME_REQUIRED: "Plan name is required",
    PLAN_TYPE_REQUIRED: "Plan type is required",
    PRICE_REQUIRED: "Price is required",
    INVALID_PLAN_TYPE: "Plan type must be monthly, quarterly, or yearly",
    INVALID_PRICE: "Price must be a positive number",
  },
  SUPPORT_TICKET: {
    NOT_FOUND: "Support ticket not found",
    FAILED_TO_FETCH: "Failed to fetch support ticket",
  },
  TRACKING: {
    TRIP_NOT_FOUND: "Trip not found",
    TRIP_ID_REQUIRED: "Trip ID is required",
    PERMISSION_DENIED:
      "You do not have permission to calculate route for this trip",
    NO_STUDENTS_ASSIGNED: "No students assigned to this trip",
    NO_STUDENTS_PICKED_FOR_DROP:
      "No students have been picked from school yet. Use school-point endpoint to mark students as picked first.",
    NO_VALID_ADDRESSES: "Could not find valid addresses for students",
    DRIVER_POSITION_OUTSIDE_CORRIDOR:
      "Driver position is outside optimized route corridor",
    TRIP_DETAILS_NOT_FOUND: "Trip details not found",
    POSITION_UPDATE_ERROR: "Failed to update driver position",
    DAYS_OLD_INVALID: "daysOld must be at least 1",
    RECALCULATION_FAILED: "Failed to recalculate route",
    TRACKING_DATA_NOT_FOUND: "No tracking data found",
    INVALID_COORDINATES:
      "Invalid coordinates - latitude and longitude required",
    SCHOOL_COORDINATES_MISSING:
      "School location coordinates are missing or invalid. Please ensure all schools have valid latitude/longitude coordinates configured.",
  },
  TRIP: {
    NOT_FOUND: "Trip not found",
    NOT_ACTIVE: "Trip is not active",
    DRIVER_ID_REQUIRED: "Driver ID is required",
    SCHOOL_ID_REQUIRED: "School ID is required",
    TRIP_TYPE_REQUIRED: "Trip type is required",
    TRIP_DATE_REQUIRED: "Trip date is required",
    INVALID_TRIP_TYPE: "Trip type must be pickup or drop",
    INVALID_TRIP_STATUS:
      "Trip status must be scheduled, started, in_progress, completed, or cancelled",
    ALREADY_EXISTS:
      "A trip for this driver with the same type already exists on this date",
    CANNOT_UPDATE_COMPLETED: "Cannot update a completed trip",
    CANNOT_START_CANCELLED: "Cannot start a cancelled trip",
    INVALID_STATUS_TRANSITION: "Invalid trip status transition",
  },
  TRIP_STUDENT: {
    NOT_FOUND: "Trip student record not found",
    TRIP_ID_REQUIRED: "Trip ID is required",
    STUDENT_ID_REQUIRED: "Student ID is required",
    ALREADY_EXISTS:
      "A trip student record for this trip and student already exists",
    INVALID_ATTENDANCE_STATUS:
      "Attendance status must be present, absent, or pending",
    INVALID_PICKUP_STATUS:
      "Pickup status must be pending, picked, dropped, or no_show",
    ATTENDANCE_ALREADY_MARKED: "Attendance has already been marked",
    INVALID_QR_CODE: "Invalid QR code",
    INVALID_OTP: "Invalid OTP",
    QR_CODE_OR_OTP_REQUIRED: "Either QR code or OTP is required",
    TRIP_NOT_STARTED: "Trip has not started yet",
    STUDENT_ALREADY_PICKED: "Student has already been picked up",
    STUDENT_ALREADY_DROPPED: "Student has already been dropped off",
    ATTENDANCE_STATUS_REQUIRED: "Attendance status is required",
    PICKUP_STATUS_REQUIRED: "Pickup status is required",
    MUST_BE_PICKED_BEFORE_DROP: "Student must be picked up before dropping off",
    NO_STUDENTS_PROVIDED: "At least one student must be provided",
    STUDENT_NOT_IN_SCHOOL: "Student does not belong to the specified school",
  },
};

export const SUCCESS_MESSAGES = {
  ADMIN: {
    ACTIVATED_SUCCESSFULLY: "Admin activated successfully",
    DEACTIVATED_SUCCESSFULLY: "Admin deactivated successfully",
    LOGIN_SUCCESSFUL: "Admin login successful",
  },
  AUTH: {
    LOGGED_OUT_SUCCESSFULLY: "Logged out successfully",
    LOGIN_SUCCESSFUL: "Login successful",
    LOGIN_OTP_SENT: "Login OTP sent to phone number",
    OTP_SENT: "OTP sent to phone number",
    PASSWORD_RESET_EMAIL_SENT:
      "If an account exists with this email, you will receive a password reset code.",
    PASSWORD_RESET_SUCCESS:
      "Password reset successful. You can now login with your new password.",
    PHONE_VERIFIED: "Phone number verified successfully",
    REGISTRATION_COMPLETED: "Registration completed successfully",
    REGISTRATION_EMAIL_SENT:
      "Registration successful. Please check your email to verify your account.",
    USER_ACTIVATED_SUCCESSFULLY: "User activated successfully",
    USER_DEACTIVATED_SUCCESSFULLY: "User deactivated successfully",
  },
  DAILY_QR_OTP: {
    FETCHED_SUCCESSFULLY: "QR code/OTP fetched successfully",
    GENERATED_SUCCESSFULLY: "QR code and OTP generated successfully",
    VERIFIED_SUCCESSFULLY: "QR code/OTP verified successfully",
  },
  DRIVER: {
    APPROVAL_STATUS_UPDATED: "Driver approval status updated successfully",
  },
  DRIVER_STUDENT_ASSIGNMENT: {
    ACTIVATED_SUCCESSFULLY: "Assignment activated successfully",
    APPROVED_SUCCESSFULLY: "Assignment approved successfully",
    DEACTIVATED_SUCCESSFULLY: "Assignment deactivated successfully",
    REASSIGNED_SUCCESSFULLY: "Driver reassigned successfully",
    REJECTED_SUCCESSFULLY: "Assignment rejected successfully",
  },
  NOTIFICATION: {
    MARKED_AS_READ_SUCCESSFULLY: "Notification marked as read successfully",
    TOKEN_REGISTERED: "Device token registered successfully",
    TOKEN_REMOVED: "Device token removed successfully",
  },
  PARENT_SUBSCRIPTION: {
    DETAILS_FETCHED: "Subscription details fetched successfully",
    RECOMMENDATIONS_FETCHED:
      "Subscription recommendations fetched successfully",
    UPGRADED_SUCCESSFULLY: "Subscription upgraded successfully",
  },
  PAYMENT: {
    COMPLETED_SUCCESSFULLY: "Payment completed successfully",
    REFUNDED_SUCCESSFULLY: "Payment refunded successfully",
  },
  PHONE: {
    LOGIN_OTP_SENT: "Login OTP sent to phone number",
    OTP_SENT: "OTP sent to phone number",
    PHONE_VERIFIED_SUCCESSFULLY: "Phone number verified successfully",
    REGISTER_OTP_RESENT: "OTP resent to phone number",
    LOGIN_OTP_RESENT: "Login OTP resent to phone number",
  },
  RATING_REVIEW: {
    SUBMITTED_SUCCESSFULLY: "Rating/review submitted successfully",
  },
  ROUTE: {
    ALTERNATIVE_ROUTES_FOUND:
      "Alternative routes found - primary and alternatives available",
    CALCULATED_SUCCESSFULLY: "Route calculated and optimized successfully",
    CLEANUP_COMPLETED_SUCCESSFULLY:
      "Tracking data cleanup completed successfully",
    CLEANUP_RECORDS_DELETED: "Deleted {count} old tracking records",
    CURRENT_POSITION_RETRIEVED_SUCCESSFULLY:
      "Current position retrieved successfully",
    DETAILS_FETCHED_SUCCESSFULLY: "Route details retrieved successfully",
    NO_ALTERNATIVE_ROUTES_AVAILABLE:
      "Primary route shown - no alternatives available",
    NO_POSITION_DATA_AVAILABLE: "No position data available yet",
    POSITION_UPDATED_SUCCESSFULLY: "Position updated successfully",
    RECALCULATED_SUCCESSFULLY: "Route recalculated successfully",
    TOMTOM_ROUTE_CALCULATED: "Optimal route calculated using TomTom Matrix API",
    TRACKING_FETCHED_SUCCESSFULLY: "Tracking data retrieved successfully",
    TRIP_ID_REQUIRED: "Trip ID is required",
  },
  SCHOOL_ADMIN: {
    LOGIN_SUCCESSFUL: "School admin logged in successfully",
    PASSWORD_CHANGED_SUCCESSFULLY: "Password changed successfully",
    REGISTERED_SUCCESSFULLY: "School admin registered successfully",
  },
  SCHOOL_SUBSCRIPTION: {
    CODES_GENERATED_SUCCESSFULLY: "Student codes generated successfully",
    RENEWED_SUCCESSFULLY: "School subscription renewed successfully",
  },
  SUBSCRIPTION_PLAN: {
    ACTIVATED_SUCCESSFULLY: "Subscription plan activated successfully",
    DEACTIVATED_SUCCESSFULLY: "Subscription plan deactivated successfully",
  },
  SUBSCRIPTION_REDEMPTION: {
    ACTIVE_SUBSCRIPTION_RETRIEVED: "Active subscription retrieved successfully",
    AVAILABLE_CODES_RETRIEVED:
      "Available redemption codes retrieved successfully",
    CODE_REDEEMED_SUCCESSFULLY: "Subscription code redeemed successfully",
    DETAILS_RETRIEVED: "Subscription details retrieved successfully",
    STATUS_RETRIEVED: "Subscription status retrieved successfully",
    SUBSCRIPTION_CANCELLED: "Subscription cancelled successfully",
    SUBSCRIPTIONS_RETRIEVED: "Subscriptions retrieved successfully",
  },
  SUPPORT_TICKET: {
    ASSIGNED_SUCCESSFULLY: "Support ticket assigned successfully",
    CLOSED_SUCCESSFULLY: "Support ticket closed successfully",
    STATUS_UPDATED_SUCCESSFULLY: "Support ticket status updated successfully",
  },
  TRIP: {
    CANCELLED_SUCCESSFULLY: "Trip cancelled successfully",
    COMPLETED_SUCCESSFULLY: "Trip completed successfully",
    PROGRESS_FETCHED_SUCCESSFULLY: "Trip progress retrieved successfully",
    STARTED_SUCCESSFULLY: "Trip started successfully",
    STATUS_UPDATED_SUCCESSFULLY: "Trip status updated successfully",
  },
  TRIP_STUDENT: {
    ATTENDANCE_MARKED_SUCCESSFULLY: "Attendance marked successfully",
    BULK_SCHOOL_ACTION_SUCCESSFUL: "Bulk school action completed successfully",
    BULK_STOP_ACTION_SUCCESSFUL: "Bulk stop action completed successfully",
    DROP_RECORDED_SUCCESSFULLY: "Student drop recorded successfully",
    PICKUP_RECORDED_SUCCESSFULLY: "Student pickup recorded successfully",
  },
};

export const DEV_MESSAGES = {
  TWILIO_OTP: {
    DEV_MODE_ENABLED:
      "[Twilio OTP Service] Running in DEVELOPMENT mode - OTP sending will be skipped",
    OTP_VERIFICATION_RESULT:
      "[DEV MODE] OTP verification for {phone}: {result} (entered: {code}, expected: {expected})",
    OTP_WOULD_BE_SENT:
      "[DEV MODE] OTP would be sent to {phone}. Test OTP: {code}",
    TEST_OTP_CODE: "[Twilio OTP Service] Test OTP Code for testers: {code}",
  },
};

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
};
