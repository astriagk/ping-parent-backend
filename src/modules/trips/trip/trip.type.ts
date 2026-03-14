import { RouteProvider, TripStatus, TripType } from "@shared/constants";

export interface Trip {
  _id?: any;
  driver_id: string;
  school_id: string;
  trip_type: TripType;
  trip_date: Date;
  trip_status: TripStatus;
  start_time?: Date;
  end_time?: Date;
  total_distance?: number;
  optimized_route_data?: any;
  route_provider?: RouteProvider; // Tracks which engine calculated the route
  created_at: Date;
  updated_at?: Date;
}

/**
 * Trip progress response for resume functionality
 * Calculated from trip_students statuses and optimized_route_data
 */
export interface TripProgress {
  tripId: string;
  tripType: TripType;
  tripStatus: TripStatus;
  currentWaypointIndex: number;
  totalWaypoints: number;
  processedStudentIds: string[]; // PICKUP: picked/dropped, DROP: dropped at home
  inTransitStudentIds: string[]; // DROP trips only: picked from school, not yet dropped
  absentStudentIds: string[];
  optimizedRouteId: string | null;
  startedAt: Date | null;
  lastPositionUpdate: Date | null;
}

/**
 * Parent info within a completed trip student response
 */
export interface CompletedTripParent {
  parent_id: string;
  name?: string;
  email?: string;
  photo_url?: string;
  phone_number?: string;
}

/**
 * Student info within a completed trip response
 */
export interface CompletedTripStudent {
  trip_student_id: string;
  student_id: string;
  student_name: string;
  student_class?: string;
  student_section?: string;
  student_roll_number?: string;
  student_photo_url?: string;
  student_gender?: string;
  attendance_status: string;
  pickup_status: string;
  pickup_time?: Date;
  drop_time?: Date;
  parent: CompletedTripParent;
}

/**
 * Completed trip details response
 */
export interface CompletedTripDetails {
  trip_id: string;
  driver_id: string;
  school_id: string;
  trip_type: TripType;
  trip_date: Date;
  trip_status: TripStatus;
  start_time?: Date;
  end_time?: Date;
  total_distance?: number;
  created_at: Date;
  students: CompletedTripStudent[];
}
