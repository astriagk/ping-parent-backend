import { TripType } from "@shared/constants";

export interface DailyQrOtp {
  _id?: any;
  /** Parent ID - one OTP per parent covering all their children */
  parent_id: string;
  /** Array of student IDs covered by this OTP */
  student_ids: string[];
  trip_id: string;
  qr_code: string;
  otp_code: string;
  trip_type: TripType;
  valid_from: Date;
  valid_until: Date;
  is_used: boolean;
  used_at?: Date;
  /** Student IDs that were verified (picked up/dropped) */
  verified_student_ids?: string[];
  /** Student IDs that were marked absent */
  absent_student_ids?: string[];
  created_at: Date;
}
