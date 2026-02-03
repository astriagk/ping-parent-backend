/**
 * Generic geolocation utility functions
 * Shared across free and premium route calculation versions
 * Used by tracking module for distance calculations and route validation
 */
import { logger } from "@shared/utils";

interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Used by both free and premium route optimization
 *
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
export const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Check if a point is within a route corridor (±buffer)
 * Used to validate driver position is on the calculated route
 *
 * @param point - Current point to check
 * @param routeCoordinates - Array of route coordinates
 * @param bufferMeters - Buffer distance in meters (default 200m)
 * @returns true if point is within corridor
 */
export const isPointWithinRouteCorridor = (
  point: Coordinate,
  routeCoordinates: [number, number][],
  bufferMeters: number = 200,
): boolean => {
  const bufferKm = bufferMeters / 1000;

  for (const routePoint of routeCoordinates) {
    const distance = calculateHaversineDistance(
      point.latitude,
      point.longitude,
      routePoint[0],
      routePoint[1],
    );

    if (distance <= bufferKm) {
      return true;
    }
  }

  return false;
};

/**
 * Calculate optimal waypoint sequence using greedy algorithm
 * Finds nearest unvisited waypoint at each step to minimize total distance
 * Used by both free (simple) and premium (TomTom) route optimization
 *
 * @param startPoint - Starting location
 * @param waypoints - Array of waypoint coordinates
 * @returns Array of indices in optimal order
 */
export const calculateOptimalSequence = (
  startPoint: Coordinate,
  waypoints: Coordinate[],
): number[] => {
  try {
    if (waypoints.length === 0) {
      return [];
    }

    // For single waypoint, return [0]
    if (waypoints.length === 1) {
      return [0];
    }

    // Simple greedy algorithm: find nearest waypoint to start, then nearest to each successive point
    const sequence: number[] = [];
    const visited = new Set<number>();
    let currentPoint = startPoint;

    while (sequence.length < waypoints.length) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < waypoints.length; i++) {
        if (visited.has(i)) continue;

        const distance = calculateHaversineDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          waypoints[i].latitude,
          waypoints[i].longitude,
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestIdx = i;
        }
      }

      if (nearestIdx === -1) break;

      sequence.push(nearestIdx);
      visited.add(nearestIdx);
      currentPoint = waypoints[nearestIdx];
    }

    return sequence;
  } catch (err) {
    // Fallback: return sequential order
    logger.error("Error calculating optimal sequence:", { err });
    return waypoints.map((_, i) => i);
  }
};

/**
 * Calculate waypoint metrics (distance, duration, ETA) from route geometry
 * Generic utility for computing arrival times and distances for each waypoint
 * Used after route geometry is retrieved from any routing service
 *
 * @param optimizedWaypoints - Array of waypoints in optimized order
 * @param routeLeg - Array of route legs with distance and duration
 * @returns Array of waypoints with calculated metrics
 */
export const calculateWaypointMetrics = (
  optimizedWaypoints: any[],
  routeLegs: Array<{ distance: number; duration: number }>,
): any[] => {
  const waypointsWithMetrics: any[] = [];
  let cumulativeDuration = 0;

  for (let i = 0; i < optimizedWaypoints.length; i++) {
    const waypoint = optimizedWaypoints[i];

    if (i < routeLegs.length) {
      const leg = routeLegs[i];
      cumulativeDuration += leg.duration;
    }

    waypointsWithMetrics.push({
      ...waypoint,
      distance_from_previous:
        i < routeLegs.length ? routeLegs[i].distance / 1000 : 0, // Convert to km
      duration_from_previous: i < routeLegs.length ? routeLegs[i].duration : 0,
      estimated_arrival_time: new Date(Date.now() + cumulativeDuration * 1000),
    });
  }

  return waypointsWithMetrics;
};

/**
 * Get route geometry using Haversine distances (simple version)
 * Creates route with intermediate coordinates along great circle path
 * Used by Haversine tier route calculation
 *
 * @param startPoint - Starting location
 * @param waypoints - Array of waypoint coordinates in order
 * @returns Route geometry with interpolated coordinates matching paid version format
 */
export const getHaversineRouteGeometry = (
  startPoint: Coordinate,
  waypoints: Coordinate[],
): {
  totalDistance: number; // in meters
  totalDuration: number; // in seconds (estimated)
  coordinates: [number, number][];
  legs: Array<{ distance: number; duration: number }>;
} => {
  const legs: Array<{ distance: number; duration: number }> = [];
  const coordinates: [number, number][] = [
    [startPoint.latitude, startPoint.longitude],
  ];
  let totalDistance = 0;
  let totalDuration = 0;
  let currentPoint = startPoint;

  // Calculate legs between consecutive waypoints using Haversine distance
  for (const waypoint of waypoints) {
    const distance = calculateHaversineDistance(
      currentPoint.latitude,
      currentPoint.longitude,
      waypoint.latitude,
      waypoint.longitude,
    );

    // Estimate duration: assume average speed of 40 km/h for urban routes
    const estimatedSpeed = 40; // km/h
    const duration = (distance / estimatedSpeed) * 3600; // in seconds

    legs.push({
      distance: distance * 1000, // Convert to meters for consistency
      duration,
    });

    // Generate intermediate coordinates along the great circle path
    // Create points every ~0.5 km or at least 10 points per segment for smooth visualization
    const segmentDistance = distance;
    const numSegments = Math.max(Math.ceil(segmentDistance / 0.5), 10);

    for (let i = 1; i <= numSegments; i++) {
      const fraction = i / numSegments;
      const intermediatePoint = interpolateCoordinate(
        currentPoint,
        waypoint,
        fraction,
      );
      coordinates.push([
        intermediatePoint.latitude,
        intermediatePoint.longitude,
      ]);
    }

    totalDistance += distance;
    totalDuration += duration;
    currentPoint = waypoint;
  }

  return {
    totalDistance: totalDistance * 1000, // Return in meters for consistency
    totalDuration,
    coordinates,
    legs,
  };
};

/**
 * Interpolate coordinate between two points using spherical linear interpolation (SLERP)
 * Creates smooth curve along great circle path
 *
 * @param start - Starting coordinate
 * @param end - Ending coordinate
 * @param fraction - Interpolation factor (0 to 1)
 * @returns Interpolated coordinate
 */
const interpolateCoordinate = (
  start: Coordinate,
  end: Coordinate,
  fraction: number,
): Coordinate => {
  // Convert to radians
  const lat1 = toRad(start.latitude);
  const lon1 = toRad(start.longitude);
  const lat2 = toRad(end.latitude);
  const lon2 = toRad(end.longitude);

  // Angular distance in radians
  const dLon = lon2 - lon1;
  const a =
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const d = Math.acos(Math.min(1, Math.max(-1, a))); // Clamp to [-1, 1] for safety

  // Handle edge case where points are the same
  if (d === 0) {
    return start;
  }

  // Spherical linear interpolation (SLERP)
  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);

  const x =
    A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y =
    A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return {
    latitude: (lat * 180) / Math.PI,
    longitude: (lon * 180) / Math.PI,
  };
};
