export interface GoogleMapsRouteWaypoint {
  latitude: number;
  longitude: number;
  address?: string;
  student_id: string | string[];
  student_parent_id?: string;
  student_name?: string;
  student_names?: string[];
  pickup_status?: string;
  student_roll_number?: string;
  student_grade?: string;
  student_section?: string;
  student_class?: string;
  student_photo_url?: string;
  student_gender?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone_number?: string;
  parent_user_id?: string;
  duration_from_previous?: number; // in seconds
  distance_from_previous?: number; // in kilometers
  estimated_arrival_time?: Date;
}

export interface GoogleMapsRouteGeometry {
  waypoints: GoogleMapsRouteWaypoint[];
  total_distance: number; // in kilometers
  total_duration: number; // in seconds
  polyline_encoded: string; // Google Maps encoded polyline (decode on frontend)
  recalculated_at?: Date; // timestamp of last auto/manual recalculation
}

export interface GoogleMapsLocationTracking {
  _id?: any;
  trip_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number; // in km/h
  heading?: number; // in degrees
  accuracy?: number; // in meters
  timestamp: Date;
  recalculated?: boolean; // true if auto-recalculation was triggered
}

export interface GoogleMapsRouteCalculationRequest {
  trip_id: string;
  current_latitude: number;
  current_longitude: number;
  traffic_model?: "best_guess" | "pessimistic" | "optimistic";
  avoid?: ("tolls" | "highways" | "ferries")[];
}

export interface GoogleMapsRouteCalculationResponse {
  success: boolean;
  _id?: string;
  trip_id: string;
  route_geometry: GoogleMapsRouteGeometry;
  total_distance: number;
  total_duration: number;
  trip_students_updated: number;
  message: string;
}

export interface GoogleMapsRecalculateRequest {
  trip_id: string;
  current_latitude: number;
  current_longitude: number;
  traffic_model?: "best_guess" | "pessimistic" | "optimistic";
  avoid?: ("tolls" | "highways" | "ferries")[];
  force_recalculate?: boolean;
}
