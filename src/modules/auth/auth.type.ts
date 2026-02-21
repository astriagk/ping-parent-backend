import { UserRole } from "@shared/constants";

export interface User {
  _id?: any; // MongoDB internal ID
  user_id: string;
  phone_number: string;
  user_type: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  last_login?: Date;
  fcm_token?: string;
}

export interface UserWithProfile extends User {
  name?: string;
  email?: string;
  photo_url?: string;
}

export interface OtpVerification {
  _id?: any; // MongoDB internal ID
  otp_id: number;
  phone_number: string;
  otp_code: string;
  is_verified: boolean;
  expires_at: Date;
  created_at: Date;
}
