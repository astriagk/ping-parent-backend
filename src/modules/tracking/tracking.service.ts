import { getDB } from "@shared/config";
import {
  DRIVERS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  UniqueCodeTypes,
} from "@shared/constants";
import { SUCCESS_MESSAGES } from "@shared/constants/messages";
import { ApiError } from "@shared/middlewares";
import { tomTomService } from "@shared/services/tomtom.service";
import { generateUniqueCode, logger } from "@shared/utils";

import { trackingRepository } from "./tracking.repository";
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

export const calculateRoute = async (
  userId: string,
  data: RouteCalculationRequest,
): Promise<RouteCalculationResponse> => {
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  const { trip_id, current_latitude, current_longitude } = data;

  const trip = await trackingRepository.getTripById(trip_id);

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
    await trackingRepository.getTripStudentsWithDetails(trip_id);

  if (waypointsToOptimize.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRACKING.NO_STUDENTS_ASSIGNED,
    );
  }

  const startPoint = {
    latitude: current_latitude,
    longitude: current_longitude,
  };

  // Calculate optimal sequence
  const sequence = await tomTomService.calculateOptimalSequence(
    startPoint,
    waypointsToOptimize.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => waypointsToOptimize[idx]);

  // Get route geometry
  const routeGeometry = await tomTomService.getRouteGeometry(
    startPoint,
    optimizedWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  // Calculate ETAs and distances for each waypoint
  const waypointsWithMetrics: RouteWaypoint[] = [];
  let cumulativeDuration = 0;

  for (let i = 0; i < optimizedWaypoints.length; i++) {
    const waypoint = optimizedWaypoints[i];

    if (i < routeGeometry.legs.length) {
      const leg = routeGeometry.legs[i];
      cumulativeDuration += leg.duration;
    }

    waypointsWithMetrics.push({
      ...waypoint,
      distance_from_previous:
        i < routeGeometry.legs.length
          ? routeGeometry.legs[i].distance / 1000
          : 0,
      duration_from_previous:
        i < routeGeometry.legs.length ? routeGeometry.legs[i].duration : 0,
      estimated_arrival_time: new Date(Date.now() + cumulativeDuration * 1000),
    });
  }

  const routeData: RouteGeometry = {
    waypoints: waypointsWithMetrics,
    total_distance: routeGeometry.totalDistance / 1000, // Convert to km
    total_duration: routeGeometry.totalDuration,
    coordinates: routeGeometry.coordinates,
  };

  // Update trip with route data
  await trackingRepository.updateTripRouteData(
    trip_id,
    routeData,
    routeGeometry.totalDistance / 1000,
  );

  // Update trip_students with sequence order and ETA
  const studentUpdates = waypointsWithMetrics
    .filter((wp) => wp.student_id) // Exclude school location
    .map((wp, idx) => ({
      student_id: wp.student_id!,
      sequence_order: idx + 1,
      estimated_arrival_time: wp.estimated_arrival_time || new Date(),
    }));

  const updatedCount = await trackingRepository.updateTripStudentsSequence(
    trip_id,
    studentUpdates,
  );

  return {
    success: true,
    trip_id,
    route_geometry: routeData,
    waypoints_optimized: waypointsWithMetrics,
    total_distance: routeData.total_distance,
    total_duration: routeGeometry.totalDuration,
    trip_students_updated: updatedCount,
    message: SUCCESS_MESSAGES.ROUTE.CALCULATED_SUCCESSFULLY,
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
    const isWithinCorridor = tomTomService.isPointWithinRouteCorridor(
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

  return await trackingRepository.insertTracking(tracking);
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
