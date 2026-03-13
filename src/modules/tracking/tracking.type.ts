import { PickupStatus } from "@shared/constants";

/**
 * School details embedded in a waypoint
 */
export interface WaypointSchool {
  school_id?: any;
  school_name?: string;
  school_address?: string;
  school_city?: string;
  school_state?: string;
  school_latitude?: number;
  school_longitude?: number;
  school_contact?: string;
  school_email?: string;
}

/**
 * Base waypoint fields shared by all waypoint types
 */
interface BaseWaypoint {
  latitude: number;
  longitude: number;
  address?: string;
  duration_from_previous?: number; // in seconds
  distance_from_previous?: number; // in kilometers
  estimated_arrival_time?: Date;
}

/**
 * Raw student waypoint as returned from the repository (before grouping)
 * Each record represents one student
 */
export interface StudentWaypoint extends BaseWaypoint {
  student_id: string;
  student_parent_id?: string;
  student_name?: string;
  pickup_status?: PickupStatus;
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
  school?: WaypointSchool;
}

/**
 * Grouped waypoint after parent grouping — multiple siblings at the same location
 * Used in route calculation and stored in optimized_route_data
 */
export interface GroupedWaypoint extends BaseWaypoint {
  student_id: string[]; // all student IDs at this stop
  student_parent_id: string; // parent ID or "SCHOOL_LOCATION" for schools
  student_names?: string[]; // all student names at this stop
  student_photo_url?: string;
  student_gender?: string;
  student_section?: string;
  student_class?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone_number?: string;
  parent_user_id?: string;
  school?: WaypointSchool;
  school_id?: string; // for school waypoints — identifies which school
  school_ids?: string[]; // all schools this pickup location serves
  school_id_map?: Record<string, string>; // maps student_id → school_id
}

/**
 * Union type for backward compatibility in RouteGeometry and other shared contexts
 */
export type RouteWaypoint = StudentWaypoint | GroupedWaypoint;

export interface NavigationInstruction {
  route_index: number;
  instruction: string;
  distance_delta: number; // Distance from previous instruction (in kilometers)
  duration_delta: number; // Duration from previous instruction (in seconds)
  distance_from_start: number; // Cumulative distance from route start (in kilometers)
  duration_from_start: number; // Cumulative time from route start (in seconds)
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

export interface RouteLeg {
  distance: number; // in kilometers
  duration: number; // in seconds
  coordinates: [number, number][]; // waypoint-to-waypoint coordinates
}

export interface RouteGeometry {
  waypoints: RouteWaypoint[];
  total_distance: number; // in kilometers
  total_duration: number; // in seconds
  coordinates: [number, number][]; // Full route polyline (all legs combined)
  legs: RouteLeg[]; // Per-segment coordinates (waypoint N → waypoint N+1)
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
  pickup_points?: GroupedWaypoint[]; // for pickup trip
  drop_location?: GroupedWaypoint; // school location for drop trips
}

export interface RouteCalculationResponse {
  _id?: string;
  trip_id: string;
  route_geometry: RouteGeometry;
  trip_students_updated: number;
  message: string;
}

export interface RouteDetailsResponse {
  trip_id: string;
  trip_type: string;
  trip_status: string;
  trip_date: Date;
  total_distance: number;
  optimized_route_data: RouteGeometry | null;
  current_position: LocationTracking | null;
  trip_students: any[];
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
