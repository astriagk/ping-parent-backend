import { TripStatus, TripType } from "@shared/constants";

export interface Trip {
  _id?: any;
  trip_id: string;
  driver_id: string;
  school_id: string;
  trip_type: TripType;
  trip_date: Date;
  trip_status: TripStatus;
  start_time?: Date;
  end_time?: Date;
  total_distance?: number;
  optimized_route_data?: any;
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
