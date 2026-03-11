import { NotificationDispatcher } from "@modules/notification/notification.dispatcher";
import { tripRepository } from "@modules/trips/trip/trip.repository";
import { getDB } from "@shared/config";
import {
  DRIVERS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PickupStatus,
  TripType,
} from "@shared/constants";
import { SUCCESS_MESSAGES } from "@shared/constants/messages";
import { ApiError } from "@shared/middlewares";
import { BroadcastService } from "@shared/services/broadcast.service";
import { isPointWithinRouteCorridor } from "@shared/services/geo-util.service";
import { googleMapsApiService } from "@shared/services/googlemaps-api.service";
import { logger } from "@shared/utils";

import {
  buildParentNotificationGroups,
  buildRouteData,
  buildStudentUpdates,
  decodePolyline,
  groupStudentsByParent,
  mapLegsToWaypoints,
  parseDirectionsResponse,
} from "./googlemaps.data-mapper";
import { googlemapsRepository } from "./googlemaps.repository";
import {
  GoogleMapsLocationTracking,
  GoogleMapsRecalculateRequest,
  GoogleMapsRouteCalculationRequest,
  GoogleMapsRouteCalculationResponse,
  GoogleMapsRouteGeometry,
  GoogleMapsRouteWaypoint,
} from "./googlemaps.type";

// ============================================
// Internal helpers (DB queries, validation)
// ============================================

const getDriverIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });

  return driver ? String(driver._id) : null;
};

const validateAndPrepareGoogleRoute = async (
  userId: string,
  tripId: string,
): Promise<{
  driverId: string;
  trip: any;
  uniqueWaypoints: GoogleMapsRouteWaypoint[];
  schoolLocation?: GoogleMapsRouteWaypoint;
}> => {
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GOOGLEMAPS.DRIVER_NOT_FOUND,
    );
  }

  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GOOGLEMAPS.TRIP_NOT_FOUND,
    );
  }

  if (trip.driver_id !== driverId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.GOOGLEMAPS.PERMISSION_DENIED,
    );
  }

  // For DROP trips: only include students who have been picked from school
  // For PICKUP trips: include all assigned students
  const pickupStatusFilter =
    trip.trip_type === TripType.DROP ? PickupStatus.PICKED : undefined;

  const waypointsToOptimize =
    await googlemapsRepository.getTripStudentsWithDetails(
      tripId,
      pickupStatusFilter,
    );

  if (waypointsToOptimize.length === 0) {
    const errorMessage =
      trip.trip_type === TripType.DROP
        ? ERROR_MESSAGES.GOOGLEMAPS.NO_STUDENTS_PICKED_FOR_DROP
        : ERROR_MESSAGES.GOOGLEMAPS.NO_STUDENTS_ASSIGNED;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorMessage);
  }

  const uniqueWaypoints = groupStudentsByParent(waypointsToOptimize);

  let schoolLocation: GoogleMapsRouteWaypoint | undefined;
  const firstStudent = waypointsToOptimize[0] as any;
  if (
    firstStudent?.school?.school_latitude &&
    firstStudent?.school?.school_longitude
  ) {
    schoolLocation = {
      latitude: firstStudent.school.school_latitude,
      longitude: firstStudent.school.school_longitude,
      address:
        firstStudent.school.school_address || firstStudent.school.school_name,
      student_id: ["SCHOOL"],
      student_parent_id: "SCHOOL_LOCATION",
      student_names: [firstStudent.school.school_name || "School"],
    };
  }

  return { driverId, trip, uniqueWaypoints, schoolLocation };
};

/**
 * Save route to DB, update student sequences, and broadcast via WebSocket.
 */
const persistAndBroadcastRoute = async (
  tripId: string,
  routeData: GoogleMapsRouteGeometry,
  waypointsWithMetrics: GoogleMapsRouteWaypoint[],
  extraBroadcastData?: Record<string, any>,
): Promise<number> => {
  await googlemapsRepository.updateTripRouteData(
    tripId,
    routeData,
    routeData.total_distance,
  );

  const studentUpdates = buildStudentUpdates(waypointsWithMetrics);

  const updatedCount = await googlemapsRepository.updateTripStudentsSequence(
    tripId,
    studentUpdates,
  );

  BroadcastService.broadcastRouteCalculated(tripId, {
    waypoints: waypointsWithMetrics,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    polyline_encoded: routeData.polyline_encoded,
    ...extraBroadcastData,
  });

  return updatedCount;
};

// ============================================
// Exported service functions
// ============================================

/**
 * Calculate optimized route using Google Maps Directions API.
 * Single API call: optimizeWaypoints=true for TSP-approximation + traffic-aware durations.
 *
 * Flow: validate trip → build waypoints → Google API → map response → save & broadcast
 */
export const calculateGoogleRoute = async (
  userId: string,
  data: GoogleMapsRouteCalculationRequest,
): Promise<GoogleMapsRouteCalculationResponse> => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.GOOGLEMAPS.API_KEY_NOT_CONFIGURED,
    );
  }

  const { uniqueWaypoints, trip, schoolLocation } =
    await validateAndPrepareGoogleRoute(userId, data.trip_id);

  // PICKUP: origin = driver, waypoints = [...homes, school] (school as destination)
  // DROP: origin = school (driver is already there), waypoints = [...homes]
  const isPickup = trip.trip_type === TripType.PICKUP;
  const startPoint =
    isPickup || !schoolLocation
      ? { latitude: data.current_latitude, longitude: data.current_longitude }
      : {
          latitude: schoolLocation.latitude,
          longitude: schoolLocation.longitude,
        };

  const allWaypoints =
    isPickup && schoolLocation
      ? [...uniqueWaypoints, schoolLocation]
      : uniqueWaypoints;

  // --- Google API call (single) ---
  const waypointCoords = allWaypoints.map((wp) => ({
    latitude: wp.latitude,
    longitude: wp.longitude,
  }));
  const response = await googleMapsApiService.getOptimizedDirections(
    startPoint,
    waypointCoords,
    { trafficModel: data.traffic_model, avoid: data.avoid },
  );

  // --- Parse API response & map to domain objects ---
  const routeResult = parseDirectionsResponse(response, allWaypoints.length);
  const optimizedWaypoints = routeResult.sequence.map(
    (idx) => allWaypoints[idx],
  );
  const waypointsWithMetrics = mapLegsToWaypoints(
    optimizedWaypoints,
    routeResult.legs,
  );
  const routeData = buildRouteData(waypointsWithMetrics, routeResult);

  // --- Persist & broadcast ---
  const updatedCount = await persistAndBroadcastRoute(
    data.trip_id,
    routeData,
    waypointsWithMetrics,
  );

  return {
    success: true,
    _id: trip._id?.toString(),
    trip_id: data.trip_id,
    route_geometry: routeData,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    trip_students_updated: updatedCount,
    message: SUCCESS_MESSAGES.GOOGLEMAPS.ROUTE_CALCULATED,
  };
};

/**
 * Recalculate route from driver's current position using Google Maps.
 * Used when driver deviates from route or requests manual recalculation.
 */
export const recalculateGoogleRoute = async (
  userId: string,
  data: GoogleMapsRecalculateRequest,
): Promise<any> => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.GOOGLEMAPS.API_KEY_NOT_CONFIGURED,
    );
  }

  const { uniqueWaypoints, trip, schoolLocation } =
    await validateAndPrepareGoogleRoute(userId, data.trip_id);

  // For recalculation, always use driver's current position as origin
  // PICKUP: waypoints = [...homes, school]
  // DROP: waypoints = [...remaining homes] (driver already left school)
  const isPickup = trip.trip_type === TripType.PICKUP;
  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  const allWaypoints =
    isPickup && schoolLocation
      ? [...uniqueWaypoints, schoolLocation]
      : uniqueWaypoints;

  // --- Google API call (single) ---
  const waypointCoords = allWaypoints.map((wp) => ({
    latitude: wp.latitude,
    longitude: wp.longitude,
  }));
  const response = await googleMapsApiService.getOptimizedDirections(
    startPoint,
    waypointCoords,
    { trafficModel: data.traffic_model, avoid: data.avoid },
  );

  // --- Parse API response & map to domain objects ---
  const routeResult = parseDirectionsResponse(response, allWaypoints.length);
  const optimizedWaypoints = routeResult.sequence.map(
    (idx) => allWaypoints[idx],
  );
  const waypointsWithMetrics = mapLegsToWaypoints(
    optimizedWaypoints,
    routeResult.legs,
  );
  const routeData = buildRouteData(waypointsWithMetrics, routeResult);

  // --- Persist & broadcast ---
  await persistAndBroadcastRoute(
    data.trip_id,
    routeData,
    waypointsWithMetrics,
    {
      recalculated_at: new Date(),
    },
  );

  return {
    success: true,
    trip_id: data.trip_id,
    recalculated_at: new Date(),
    route_geometry: routeData,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    message: SUCCESS_MESSAGES.GOOGLEMAPS.ROUTE_RECALCULATED,
  };
};

/**
 * Auto-recalculate route when driver deviates >100m from corridor.
 * Runs in background — does not block position update response.
 * 30-second cooldown prevents API spam during continuous deviation.
 */
const autoRecalculateAndNotify = async (
  userId: string,
  tripId: string,
  latitude: number,
  longitude: number,
): Promise<void> => {
  // Cooldown check: don't recalculate if last recalc was <30s ago
  const trip = await tripRepository.findById(tripId);
  const lastRecalc = trip?.optimized_route_data?.recalculated_at;
  if (lastRecalc && Date.now() - new Date(lastRecalc).getTime() < 30000) {
    return;
  }

  // Recalculate route from current position
  const result = await recalculateGoogleRoute(userId, {
    trip_id: tripId,
    current_latitude: latitude,
    current_longitude: longitude,
  });

  // Build parent notification groups and send ETA updates
  const tripStudents =
    await googlemapsRepository.getTripStudentsWithDetails(tripId);
  const parentGroups = buildParentNotificationGroups(
    tripStudents,
    result.route_geometry?.waypoints || [],
  );

  for (const [parentId, group] of parentGroups.entries()) {
    await NotificationDispatcher.notifyParentRouteRecalculated(
      parentId,
      group.parentUserId,
      tripId,
      group.students,
      group.etas,
    );
  }
};

/**
 * Update driver GPS position and broadcast to trip subscribers.
 * Triggers auto-recalculation if driver deviates >100m from route corridor.
 */
export const updateGoogleDriverPosition = async (
  userId: string,
  tripId: string,
  latitude: number,
  longitude: number,
  speed?: number,
  heading?: number,
  accuracy?: number,
): Promise<GoogleMapsLocationTracking> => {
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GOOGLEMAPS.DRIVER_NOT_FOUND,
    );
  }

  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GOOGLEMAPS.TRIP_NOT_FOUND,
    );
  }

  if (trip.driver_id !== driverId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.GOOGLEMAPS.PERMISSION_DENIED,
    );
  }

  // Corridor deviation check (100m buffer)
  let recalculated = false;
  if (trip.optimized_route_data?.polyline_encoded) {
    const routeCoordinates = decodePolyline(
      trip.optimized_route_data.polyline_encoded,
    );

    const isWithinCorridor = isPointWithinRouteCorridor(
      { latitude, longitude },
      routeCoordinates,
      100,
    );

    if (!isWithinCorridor) {
      logger.warn(ERROR_MESSAGES.GOOGLEMAPS.DRIVER_OUTSIDE_CORRIDOR);

      if (process.env.GOOGLE_MAPS_API_KEY) {
        recalculated = true;
        autoRecalculateAndNotify(userId, tripId, latitude, longitude).catch(
          (err: Error) =>
            logger.error(
              ERROR_MESSAGES.GOOGLEMAPS.AUTO_RECALCULATE_FAILED,
              err,
            ),
        );
      }
    }
  }

  const trackingData: Omit<GoogleMapsLocationTracking, "_id"> = {
    trip_id: tripId,
    driver_id: driverId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    accuracy: accuracy || 0,
    timestamp: new Date(),
  };

  const result = await googlemapsRepository.upsertTracking(
    tripId,
    trackingData,
  );

  if (!result) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GOOGLEMAPS.POSITION_UPDATE_ERROR,
    );
  }

  BroadcastService.broadcastPositionUpdate(tripId, {
    driverId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    accuracy: accuracy || 0,
  });

  return {
    trip_id: result.trip_id,
    driver_id: result.driver_id,
    latitude: result.latitude,
    longitude: result.longitude,
    speed: result.speed,
    heading: result.heading,
    accuracy: result.accuracy,
    timestamp: result.timestamp,
    recalculated,
  };
};

/**
 * Fetch tracking history for a trip.
 */
export const getGoogleRouteTracking = async (
  tripId: string,
  limit: number = 100,
): Promise<GoogleMapsLocationTracking[]> => {
  const tracking = await googlemapsRepository.getTrackingByTripId(tripId);
  return tracking.slice(0, limit).map((t) => ({
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

/**
 * Get latest driver position for a trip.
 */
export const getLatestGoogleDriverPosition = async (
  tripId: string,
): Promise<GoogleMapsLocationTracking | null> => {
  const latest = await googlemapsRepository.getLatestTrackingByTripId(tripId);
  return latest
    ? {
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

/**
 * Get full route details including trip info, route data, students, and position.
 */
export const getGoogleRouteDetails = async (tripId: string): Promise<any> => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GOOGLEMAPS.TRIP_NOT_FOUND,
    );
  }

  const latestPosition = await getLatestGoogleDriverPosition(tripId);
  const tripStudents = await googlemapsRepository.getTripStudents(tripId);

  return {
    trip_id: String(trip._id),
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
 * Clean old tracking data (admin utility).
 */
export const cleanOldGoogleTrackingData = async (
  daysOld: number = 30,
): Promise<number> => {
  return await googlemapsRepository.cleanOldTrackingData(daysOld);
};
