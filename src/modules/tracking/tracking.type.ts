import { PickupStatus } from "@shared/constants";

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  address?: string;
  student_id: string | string[]; // can be string from repository or array after grouping
  student_parent_id?: string; // parent id to group students from same parent
  student_name?: string; // single student name from repository (before grouping)
  student_names?: string[]; // array of student names (after grouping)
  pickup_status?: PickupStatus; // PickupStatus enum: pending, picked, dropped, no_show
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

export interface NavigationInstruction {
  route_index: number;
  instruction: string;
  distance: number; // in kilometers
  duration: number; // in seconds
  coordinates: [number, number][]; // turn-by-turn waypoints
}

export interface NextPickupNavigation {
  current_waypoint_index: number;
  next_waypoint: RouteWaypoint;
  distance_to_next: number; // in kilometers
  duration_to_next: number; // in seconds
  instructions: NavigationInstruction[];
  route_geometry: [number, number][]; // full coordinates to next point
  alternative_routes?: AlternativeRoute[];
}

export interface AlternativeRoute {
  route_id: string;
  distance: number; // in km
  duration: number; // in seconds
  coordinates: [number, number][];
  summary: string;
}

export interface RecalculateRouteRequest {
  trip_id: string;
  current_latitude: number;
  current_longitude: number;
  avoid_coordinates?: Array<{ latitude: number; longitude: number }>; // areas to avoid
  force_recalculate?: boolean;
}

export interface RouteGeometry {
  waypoints: RouteWaypoint[];
  total_distance: number; // in kilometers
  total_duration: number; // in seconds
  coordinates: [number, number][]; // Direct from TomTom leg.points
  navigation_instructions?: NavigationInstruction[]; // Turn-by-turn from TomTom guides
  route_type?: "primary" | "alternative"; // indicates if this is primary or alternative route
  has_alternatives?: boolean; // whether alternative routes exist
  alternative_routes_count?: number; // count of available alternatives
  traffic_delay?: number; // traffic delay in seconds
  route_confidence?: "high" | "medium" | "low"; // accuracy/reliability of route
}

export interface LocationTracking {
  _id?: any;
  trip_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number; // in km/h
  heading?: number; // in degrees
  accuracy?: number; // in meters
  timestamp: Date;
}

export interface RouteCalculationRequest {
  trip_id: string;
  current_latitude: number;
  current_longitude: number;
  pickup_points?: RouteWaypoint[]; // for pickup trip
  drop_location?: RouteWaypoint; // school location for drop trips
}

export interface RouteCalculationResponse {
  success: boolean;
  _id?: string;
  trip_id: string;
  route_geometry: RouteGeometry;
  total_distance: number;
  total_duration: number;
  trip_students_updated: number; // count of updated trip_students
  navigation_instructions?: NavigationInstruction[]; // Turn-by-turn directions
  message: string;
}

export interface TrackingSubscription {
  _id?: any;
  parent_id: string;
  trip_id: string;
  driver_id: string;
  subscribed_at: Date;
  last_position?: LocationTracking;
  is_active: boolean;
}
