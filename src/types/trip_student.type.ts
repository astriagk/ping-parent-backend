import { AttendanceStatus, PickupStatus } from "@constants";

export interface TripStudent {
  _id?: any;
  trip_student_id: string;
  trip_id: string;
  student_id: string;
  sequence_order?: number; // Optimized order - calculated by system
  estimated_arrival_time?: string; // Calculated ETA - time format
  attendance_status: AttendanceStatus;
  pickup_status: PickupStatus;
  pickup_time?: Date;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_qr_code?: string;
  pickup_otp?: string;
  drop_time?: Date;
  drop_latitude?: number;
  drop_longitude?: number;
  drop_qr_code?: string;
  drop_otp?: string;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
}
