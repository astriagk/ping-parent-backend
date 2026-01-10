import { TripType } from "@shared/constants";

export interface DailyQrOtp {
  _id?: any;
  qr_otp_id: string;
  student_id: string;
  trip_id: string;
  qr_code: string;
  otp_code: string;
  trip_type: TripType;
  valid_from: Date;
  valid_until: Date;
  is_used: boolean;
  used_at?: Date;
  created_at: Date;
}
