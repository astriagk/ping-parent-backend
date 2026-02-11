import { AttendanceStatus, PickupStatus } from "@shared/constants";

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

/**
 * Trip student with student details for driver selection screen
 * Used before school-point to show driver which students to select
 */
export interface TripStudentWithDetails {
  trip_student_id: string;
  trip_id: string;
  student_id: string;
  sequence_order?: number;
  attendance_status: AttendanceStatus;
  pickup_status: PickupStatus;
  // Student details
  student_name: string;
  student_photo_url?: string;
  student_class?: string;
  student_section?: string;
  student_roll_number?: string;
  student_gender?: string;
  // Parent details
  parent_id?: string;
  parent_name?: string;
  parent_phone_number?: string;
  parent_photo_url?: string;
}

/**
 * Student info within a parent group
 */
export interface StudentInGroup {
  trip_student_id: string;
  student_id: string;
  student_name: string;
  student_photo_url?: string;
  student_class?: string;
  student_section?: string;
  student_roll_number?: string;
  student_gender?: string;
  sequence_order?: number;
  attendance_status: AttendanceStatus;
  pickup_status: PickupStatus;
}

/**
 * Trip students grouped by parent for driver selection screen
 * One parent can have multiple children (siblings) in the same trip
 */
export interface TripStudentsGroupedByParent {
  parent_id: string;
  parent_name?: string;
  parent_phone_number?: string;
  parent_photo_url?: string;
  students: StudentInGroup[];
}
