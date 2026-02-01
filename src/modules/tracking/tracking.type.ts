export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  address?: string;
  student_id?: string;
  duration_from_previous?: number; // in seconds
  distance_from_previous?: number; // in kilometers
  estimated_arrival_time?: Date;
}

export interface RouteGeometry {
  waypoints: RouteWaypoint[];
  total_distance: number; // in kilometers
  total_duration: number; // in seconds
  coordinates: [number, number][]; // array of [lat, lng]
}

export interface LocationTracking {
  _id?: any;
  tracking_id: string;
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
  trip_id: string;
  route_geometry: RouteGeometry;
  waypoints_optimized: RouteWaypoint[];
  total_distance: number;
  total_duration: number;
  trip_students_updated: number; // count of updated trip_students
  message: string;
}

export interface TrackingSubscription {
  _id?: any;
  subscription_id: string;
  parent_id: string;
  trip_id: string;
  driver_id: string;
  subscribed_at: Date;
  last_position?: LocationTracking;
  is_active: boolean;
}
