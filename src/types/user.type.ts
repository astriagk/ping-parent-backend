// Table: users
export interface User {
  _id?: any; // MongoDB internal ID
  user_id?: string;
  phone_number: string;
  user_type: "parent" | "driver";
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
  fcm_token?: string;
}

// Table: otp_verification
export interface OtpVerification {
  _id?: any;
  otp_id?: number;
  phone_number: string;
  otp_code: string;
  is_verified?: boolean;
  expires_at: Date;
  created_at?: Date;
}
