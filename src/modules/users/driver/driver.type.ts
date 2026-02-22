import { ApprovalStatus, VehicleType } from "@shared/constants";

// Onboarding Screen Enum
export enum DriverOnboardingScreen {
  SIGNUP = "signup",
  PROFILE = "profile",
  DOCUMENTS = "documents",
}

export const DriverOnboardingScreenArray = Object.values(
  DriverOnboardingScreen,
);

// Onboarding Screen Interface
export interface DriverOnboarding {
  _id?: any;
  user_id: string;
  screen_name: DriverOnboardingScreen;
  updated_at?: Date;
}

// Table: drivers
export interface Driver {
  _id?: any;
  user_id: string;
  driver_unique_id?: string;
  name: string;
  email?: string;
  photo_url?: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_capacity: number;
  current_student_count?: number;
  approval_status?: ApprovalStatus;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  is_available?: boolean;
  rating?: number;
  total_trips?: number;
  school_id?: string; // FK to schools - for school-employed drivers
  created_at?: Date;
  updated_at?: Date;
}

// Table: driver_addresses
export interface DriverAddress {
  _id?: any;
  driver_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  is_primary?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Table: driver_documents
export interface DriverDocument {
  _id?: any;
  driver_id: string;
  driving_license_number: string;
  driving_license_photo_url?: string;
  vehicle_license_number: string;
  vehicle_license_photo_url?: string;
  insurance_number?: string;
  insurance_photo_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Reusable type for driver input (omits auto-generated/internal fields)
export type DriverInput = Omit<
  Driver,
  | "_id"
  | "driver_unique_id"
  | "current_student_count"
  | "approval_status"
  | "approved_by"
  | "approved_at"
  | "rating"
  | "total_trips"
  | "created_at"
  | "updated_at"
>;

// Type for updating driver profile
export type DriverProfileUpdate = Partial<
  Pick<
    Driver,
    | "name"
    | "email"
    | "photo_url"
    | "vehicle_type"
    | "vehicle_number"
    | "vehicle_capacity"
    | "is_available"
  >
>;

// Type for driver address input
export type DriverAddressInput = Omit<
  DriverAddress,
  "_id" | "created_at" | "updated_at"
>;

// Type for updating driver address
export type DriverAddressUpdate = Partial<
  Omit<DriverAddress, "_id" | "driver_id" | "created_at" | "updated_at">
>;

// Type for driver document input
export type DriverDocumentInput = Omit<
  DriverDocument,
  "_id" | "created_at" | "updated_at"
>;

// Type for uploading/updating documents
export type DriverDocumentUpdate = Partial<
  Omit<DriverDocument, "_id" | "driver_id" | "created_at" | "updated_at">
>;
