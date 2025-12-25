// Table: trips
export interface Trip {
  _id?: any; // MongoDB internal ID
  trip_id?: string;
  driver_id: string;
  school_id: string;
  trip_type: "pickup" | "drop";
  trip_date: Date;
  trip_status?: "scheduled" | "started" | "in_progress" | "completed" | "cancelled";
  start_time?: Date;
  end_time?: Date;
  total_distance?: number;
  optimized_route_data?: any; // JSON field
  created_at?: Date;
  updated_at?: Date;
}

// Table: trip_students
export interface TripStudent {
  _id?: any; // MongoDB internal ID
  trip_student_id?: string;
  trip_id: string;
  student_id: string;
  sequence_order?: number;
  estimated_arrival_time?: string; // time field
  attendance_status?: "present" | "absent" | "pending";
  pickup_status?: "pending" | "picked" | "dropped" | "no_show";
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
  created_at?: Date;
  updated_at?: Date;
}

// Table: location_tracking
export interface LocationTracking {
  _id?: any; // MongoDB internal ID
  tracking_id?: string;
  trip_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: Date;
}

// Table: daily_qr_otp
export interface DailyQrOtp {
  _id?: any; // MongoDB internal ID
  qr_otp_id?: string;
  student_id: string;
  trip_id: string;
  qr_code: string;
  otp_code: string;
  trip_type: "pickup" | "drop";
  valid_from: Date;
  valid_until: Date;
  is_used?: boolean;
  used_at?: Date;
  created_at?: Date;
}
