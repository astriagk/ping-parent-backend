import { getDB } from "@shared/config";
import {
  DRIVERS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  UniqueCodeTypes,
} from "@shared/constants";
import { SUCCESS_MESSAGES } from "@shared/constants/messages";
import { ApiError } from "@shared/middlewares";
import {
  calculateOptimalSequence,
  calculateWaypointMetrics,
  getHaversineRouteGeometry,
  isPointWithinRouteCorridor,
} from "@shared/services/geo-util.service";
import { tomTomService } from "@shared/services/tomtom.service";
import { generateUniqueCode, logger } from "@shared/utils";

import { trackingRepository } from "./tracking.repository";
import { TrackingSocketService } from "./tracking.socket.service";
import {
  LocationTracking,
  RouteCalculationRequest,
  RouteCalculationResponse,
  RouteGeometry,
  RouteWaypoint,
} from "./tracking.type";

const getDriverIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });

  return driver ? String(driver._id) : null;
};

/**
 * Group students by parent_id to avoid multiple pickups from same location
 * Returns unique locations with all students from that location
 * student_id and student_names are always arrays for consistent FE handling
 */
const groupStudentsByParent = (students: RouteWaypoint[]): RouteWaypoint[] => {
  const grouped = new Map<string, RouteWaypoint[]>();

  // Group students by parent_id
  for (const student of students) {
    const parentId =
      student.student_parent_id || `default-${student.student_id[0]}`;
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId)!.push(student);
  }

  // Create unique waypoints (one per parent location)
  const uniqueWaypoints: RouteWaypoint[] = [];
  for (const [parentId, studentList] of grouped.entries()) {
    // Use the first student's location as the pickup point for all
    const firstStudent = studentList[0];

    // Build arrays from individual student data
    // student_id is already an array from repository, so just flatten it
    // student_name from repository (singular) needs to be converted to student_names array
    const studentIds = studentList.flatMap((s) => {
      // Handle both array and single string formats for backward compatibility
      if (Array.isArray(s.student_id)) {
        return s.student_id;
      }
      return s.student_id ? [s.student_id] : [];
    });

    const studentNames = studentList
      .map((s) => s.student_name) // Get individual student_name from each student
      .filter(Boolean) as string[]; // Remove null/undefined values

    uniqueWaypoints.push({
      latitude: firstStudent.latitude,
      longitude: firstStudent.longitude,
      address: firstStudent.address,
      student_id: studentIds, // array of student IDs
      student_parent_id: parentId,
      student_names: studentNames, // array of student names
    });
  }

  return uniqueWaypoints;
};

/**
 * Validate trip ownership and get prepared waypoints
 * Common validation for all route calculation functions
 */
const validateAndPrepareRoute = async (
  userId: string,
  tripId: string,
): Promise<{
  driverId: string;
  trip: any;
  uniqueWaypoints: RouteWaypoint[];
}> => {
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  const trip = await trackingRepository.getTripById(tripId);
  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRACKING.TRIP_NOT_FOUND,
    );
  }

  if (trip.driver_id !== driverId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.TRACKING.PERMISSION_DENIED,
    );
  }

  const waypointsToOptimize =
    await trackingRepository.getTripStudentsWithDetails(tripId);

  if (waypointsToOptimize.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRACKING.NO_STUDENTS_ASSIGNED,
    );
  }

  const uniqueWaypoints = groupStudentsByParent(waypointsToOptimize);

  return { driverId, trip, uniqueWaypoints };
};

/**
 * Calculate route geometry and ETAs for optimized waypoints (Haversine Version)
 * Uses simple Haversine distance without external API calls
 */
const calculateGeometryAndETasHaversine = async (
  startPoint: { latitude: number; longitude: number },
  optimizedWaypoints: RouteWaypoint[],
): Promise<{
  waypointsWithMetrics: RouteWaypoint[];
  routeData: RouteGeometry;
  routeGeometry: any;
}> => {
  // Get route geometry using Haversine distances
  const routeGeometry = getHaversineRouteGeometry(
    startPoint,
    optimizedWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  // Calculate metrics (distance, duration, ETA) for each waypoint
  const waypointsWithMetrics = calculateWaypointMetrics(
    optimizedWaypoints,
    routeGeometry.legs,
  ) as RouteWaypoint[];

  const routeData: RouteGeometry = {
    waypoints: waypointsWithMetrics,
    total_distance: routeGeometry.totalDistance / 1000,
    total_duration: routeGeometry.totalDuration,
    coordinates: routeGeometry.coordinates,
  };

  return { waypointsWithMetrics, routeData, routeGeometry };
};

/**
 * Calculate route geometry and ETAs for optimized waypoints (TomTom Version)
 * Uses TomTom routing API for accurate road distances and durations
 */
const calculateGeometryAndETasTomTom = async (
  startPoint: { latitude: number; longitude: number },
  optimizedWaypoints: RouteWaypoint[],
): Promise<{
  waypointsWithMetrics: RouteWaypoint[];
  routeData: RouteGeometry;
  routeGeometry: any;
}> => {
  // Get route geometry from TomTom
  const routeGeometry = await tomTomService.getRouteGeometry(
    startPoint,
    optimizedWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  // Calculate metrics (distance, duration, ETA) for each waypoint
  const waypointsWithMetrics = calculateWaypointMetrics(
    optimizedWaypoints,
    routeGeometry.legs,
  ) as RouteWaypoint[];

  const routeData: RouteGeometry = {
    waypoints: waypointsWithMetrics,
    total_distance: routeGeometry.totalDistance / 1000,
    total_duration: routeGeometry.totalDuration,
    coordinates: routeGeometry.coordinates,
  };

  return { waypointsWithMetrics, routeData, routeGeometry };
};

/**
 * Update trip in database and broadcast to WebSocket subscribers
 * Common logic for all route calculation functions
 */
const updateAndBroadcastRoute = async (
  tripId: string,
  routeData: RouteGeometry,
  waypointsWithMetrics: RouteWaypoint[],
): Promise<number> => {
  // Update trip with route data
  await trackingRepository.updateTripRouteData(
    tripId,
    routeData,
    routeData.total_distance,
  );

  // Update trip_students with sequence order and ETA
  // Flatten grouped students (array of IDs) into individual updates
  const studentUpdates = waypointsWithMetrics
    .filter((wp) => wp.student_id)
    .flatMap((wp, idx) => {
      const studentIds = Array.isArray(wp.student_id)
        ? wp.student_id
        : [wp.student_id];

      return studentIds
        .filter((id) => id) // Remove empty values
        .map((id) => ({
          student_id: id,
          sequence_order: idx + 1,
          estimated_arrival_time: wp.estimated_arrival_time || new Date(),
        }));
    });

  const updatedCount = await trackingRepository.updateTripStudentsSequence(
    tripId,
    studentUpdates,
  );

  // Broadcast route calculation to parents and driver
  TrackingSocketService.broadcastRouteCalculated(tripId, {
    waypoints: waypointsWithMetrics,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    coordinates: routeData.coordinates,
  });

  return updatedCount;
};

export const calculateRoute = async (
  userId: string,
  data: RouteCalculationRequest,
): Promise<RouteCalculationResponse> => {
  // Validate and prepare
  const { uniqueWaypoints } = await validateAndPrepareRoute(
    userId,
    data.trip_id,
  );

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  // Calculate optimal sequence using grouped waypoints
  const sequence = calculateOptimalSequence(
    startPoint,
    uniqueWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => uniqueWaypoints[idx]);

  // Calculate geometry and ETAs using Haversine version (simple distance)
  const { waypointsWithMetrics, routeData } =
    await calculateGeometryAndETasHaversine(startPoint, optimizedWaypoints);

  // Update DB and broadcast
  const updatedCount = await updateAndBroadcastRoute(
    data.trip_id,
    routeData,
    waypointsWithMetrics,
  );

  return {
    success: true,
    trip_id: data.trip_id,
    route_geometry: routeData,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    trip_students_updated: updatedCount,
    message: SUCCESS_MESSAGES.ROUTE.CALCULATED_SUCCESSFULLY,
  };
};

export const calculateOptimalRouteWithTomTom = async (
  userId: string,
  data: RouteCalculationRequest,
): Promise<RouteCalculationResponse> => {
  // Validate and prepare
  const { uniqueWaypoints } = await validateAndPrepareRoute(
    userId,
    data.trip_id,
  );

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  // Calculate optimal sequence using TomTom Matrix API with grouped waypoints
  const { sequence } = await tomTomService.calculateOptimalSequenceWithTomTom(
    startPoint,
    uniqueWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => uniqueWaypoints[idx]);

  // Calculate geometry and ETAs using TomTom version (accurate API-based)
  const { waypointsWithMetrics, routeData } =
    await calculateGeometryAndETasTomTom(startPoint, optimizedWaypoints);

  // Update DB and broadcast
  const updatedCount = await updateAndBroadcastRoute(
    data.trip_id,
    routeData,
    waypointsWithMetrics,
  );

  // Return same structure as Haversine version for consistent FE integration
  return {
    success: true,
    trip_id: data.trip_id,
    route_geometry: routeData,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    trip_students_updated: updatedCount,
    message: SUCCESS_MESSAGES.ROUTE.TOMTOM_ROUTE_CALCULATED,
  };
};

export const updateDriverPosition = async (
  userId: string,
  tripId: string,
  latitude: number,
  longitude: number,
  speed?: number,
  heading?: number,
  accuracy?: number,
): Promise<LocationTracking> => {
  // Get driver_id from userId
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  // Get trip and validate it belongs to driver
  const trip = await trackingRepository.getTripById(tripId);
  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRACKING.TRIP_NOT_FOUND,
    );
  }

  if (trip.driver_id !== driverId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.TRACKING.PERMISSION_DENIED,
    );
  }

  // Validate position is within route corridor if route is calculated
  if (trip.optimized_route_data?.coordinates) {
    const isWithinCorridor = isPointWithinRouteCorridor(
      { latitude, longitude },
      trip.optimized_route_data.coordinates,
      200, // 200m buffer
    );

    if (!isWithinCorridor) {
      logger.warn(ERROR_MESSAGES.TRACKING.DRIVER_POSITION_OUTSIDE_CORRIDOR);
      // Don't throw error, just log warning
    }
  }

  // Create tracking record
  const tracking: Omit<LocationTracking, "_id"> = {
    tracking_id: generateUniqueCode(UniqueCodeTypes.LOCATION),
    trip_id: tripId,
    driver_id: driverId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    accuracy: accuracy || 0,
    timestamp: new Date(),
  };

  const result = await trackingRepository.insertTracking(tracking);

  // Broadcast position update to all parents watching this trip
  TrackingSocketService.broadcastPositionUpdate(tripId, {
    driverId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    accuracy: accuracy || 0,
  });

  return result;
};

export const getRouteTracking = async (
  tripId: string,
  limit: number = 100,
): Promise<LocationTracking[]> => {
  const tracking = await trackingRepository.getTrackingByTripId(tripId);
  return tracking.slice(0, limit).map((t) => ({
    tracking_id: t.tracking_id,
    trip_id: t.trip_id,
    driver_id: t.driver_id,
    latitude: t.latitude,
    longitude: t.longitude,
    speed: t.speed,
    heading: t.heading,
    accuracy: t.accuracy,
    timestamp: t.timestamp,
  }));
};

export const getLatestDriverPosition = async (
  tripId: string,
): Promise<LocationTracking | null> => {
  const latest = await trackingRepository.getLatestTrackingByTripId(tripId);
  return latest
    ? {
        tracking_id: latest.tracking_id,
        trip_id: latest.trip_id,
        driver_id: latest.driver_id,
        latitude: latest.latitude,
        longitude: latest.longitude,
        speed: latest.speed,
        heading: latest.heading,
        accuracy: latest.accuracy,
        timestamp: latest.timestamp,
      }
    : null;
};

export const getRouteDetails = async (tripId: string): Promise<any> => {
  const trip = await trackingRepository.getTripById(tripId);

  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRACKING.TRIP_NOT_FOUND,
    );
  }

  const latestPosition = await getLatestDriverPosition(tripId);
  const tripStudents = await trackingRepository.getTripStudents(tripId);

  return {
    trip_id: trip.trip_id,
    trip_type: trip.trip_type,
    trip_status: trip.trip_status,
    trip_date: trip.trip_date,
    total_distance: trip.total_distance,
    optimized_route_data: trip.optimized_route_data,
    current_position: latestPosition,
    trip_students: tripStudents,
  };
};

/**
 * Clean old tracking data (older than specified days)
 */
export const cleanOldTrackingData = async (
  daysOld: number = 30,
): Promise<number> => {
  return await trackingRepository.cleanOldTrackingData(daysOld);
};

/**
 * Recalculate route from current position
 * Used when driver changes route or wants alternative
 */
export const recalculateRoute = async (
  userId: string,
  data: any, // RecalculateRouteRequest
): Promise<any> => {
  // Validate and prepare
  const { uniqueWaypoints } = await validateAndPrepareRoute(
    userId,
    data.trip_id,
  );

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  // Recalculate optimal sequence with new start point using grouped waypoints
  const { sequence } = await tomTomService.calculateOptimalSequenceWithTomTom(
    startPoint,
    uniqueWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => uniqueWaypoints[idx]);

  // Calculate geometry and ETAs using TomTom version (accurate API-based)
  const { waypointsWithMetrics, routeData } =
    await calculateGeometryAndETasTomTom(startPoint, optimizedWaypoints);

  // Update DB and broadcast with recalculation timestamp
  await trackingRepository.updateTripRouteData(
    data.trip_id,
    routeData,
    routeData.total_distance,
  );

  const studentUpdates = waypointsWithMetrics
    .filter((wp) => wp.student_id)
    .flatMap((wp, idx) => {
      const studentIds = Array.isArray(wp.student_id)
        ? wp.student_id
        : [wp.student_id];

      return studentIds
        .filter((id) => id) // Remove empty values
        .map((id) => ({
          student_id: id,
          sequence_order: idx + 1,
          estimated_arrival_time: wp.estimated_arrival_time || new Date(),
        }));
    });

  await trackingRepository.updateTripStudentsSequence(
    data.trip_id,
    studentUpdates,
  );

  // Broadcast recalculated route
  TrackingSocketService.broadcastRouteCalculated(data.trip_id, {
    waypoints: waypointsWithMetrics,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    coordinates: routeData.coordinates,
    recalculated_at: new Date(),
  });

  return {
    success: true,
    trip_id: data.trip_id,
    recalculated_at: new Date(),
    route_geometry: routeData,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    message: SUCCESS_MESSAGES.ROUTE.RECALCULATED_SUCCESSFULLY,
  };
};
