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
import {
  calculateOptimalSequence,
  calculateWaypointMetrics,
  getHaversineRouteGeometry,
  isPointWithinRouteCorridor,
} from "@shared/services/geo-util.service";
import { googleMapsApiService } from "@shared/services/googlemaps-api.service";
import { tomTomService } from "@shared/services/tomtom.service";
import { logger } from "@shared/utils";

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

// Groups students by parent_id to create unique waypoints per location
const groupStudentsByParent = (students: RouteWaypoint[]): RouteWaypoint[] => {
  const grouped = new Map<string, RouteWaypoint[]>();

  for (const student of students) {
    const parentId =
      student.student_parent_id || `default-${student.student_id[0]}`;
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId)!.push(student);
  }

  const uniqueWaypoints: RouteWaypoint[] = [];
  for (const [parentId, studentList] of grouped.entries()) {
    const firstStudent = studentList[0];

    const studentIds = studentList.flatMap((s) => {
      if (Array.isArray(s.student_id)) {
        return s.student_id;
      }
      return s.student_id ? [s.student_id] : [];
    });

    const studentNames = studentList
      .map((s) => s.student_name)
      .filter(Boolean) as string[];

    const studentPhotos = studentList
      .map((s) => s.student_photo_url)
      .filter(Boolean) as string[];

    const studentGenders = studentList
      .map((s) => s.student_gender)
      .filter(Boolean) as string[];

    const studentSections = studentList
      .map((s) => s.student_section)
      .filter(Boolean) as string[];

    const studentClasses = studentList
      .map((s) => s.student_class)
      .filter(Boolean) as string[];

    uniqueWaypoints.push({
      latitude: firstStudent.latitude,
      longitude: firstStudent.longitude,
      address: firstStudent.address,
      student_id: studentIds,
      student_parent_id: parentId,
      student_names: studentNames,
      student_photo_url:
        studentPhotos.length > 0 ? studentPhotos[0] : undefined,
      student_gender: studentGenders.length > 0 ? studentGenders[0] : undefined,
      student_section:
        studentSections.length > 0 ? studentSections[0] : undefined,
      student_class: studentClasses.length > 0 ? studentClasses[0] : undefined,
      parent_name: firstStudent.parent_name,
      parent_email: firstStudent.parent_email,
      parent_phone_number: firstStudent.parent_phone_number,
      parent_user_id: firstStudent.parent_user_id,
    });
  }

  return uniqueWaypoints;
};

/**
 * Validate trip ownership and get prepared waypoints
 */
const validateAndPrepareRoute = async (
  userId: string,
  tripId: string,
): Promise<{
  driverId: string;
  trip: any;
  uniqueWaypoints: RouteWaypoint[];
  schoolLocation?: RouteWaypoint;
}> => {
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  const trip = await tripRepository.findById(tripId);
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

  // For DROP trips: only include students who have been picked from school
  // For PICKUP trips: include all assigned students
  const pickupStatusFilter =
    trip.trip_type === TripType.DROP ? PickupStatus.PICKED : undefined;

  const waypointsToOptimize =
    await trackingRepository.getTripStudentsWithDetails(
      tripId,
      pickupStatusFilter,
    );

  if (waypointsToOptimize.length === 0) {
    const errorMessage =
      trip.trip_type === TripType.DROP
        ? ERROR_MESSAGES.TRACKING.NO_STUDENTS_PICKED_FOR_DROP
        : ERROR_MESSAGES.TRACKING.NO_STUDENTS_ASSIGNED;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, errorMessage);
  }

  const uniqueWaypoints = groupStudentsByParent(waypointsToOptimize);

  let schoolLocation: RouteWaypoint | undefined;
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

// Calculates route geometry and metrics using Haversine distance
const calculateGeometryAndETasHaversine = async (
  startPoint: { latitude: number; longitude: number },
  optimizedWaypoints: RouteWaypoint[],
): Promise<{
  waypointsWithMetrics: RouteWaypoint[];
  routeData: RouteGeometry;
  routeGeometry: any;
}> => {
  const routeGeometry = getHaversineRouteGeometry(
    startPoint,
    optimizedWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

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

// Calculates route geometry and metrics using TomTom API
const calculateGeometryAndETasTomTom = async (
  startPoint: { latitude: number; longitude: number },
  optimizedWaypoints: RouteWaypoint[],
): Promise<{
  waypointsWithMetrics: RouteWaypoint[];
  routeData: RouteGeometry;
  routeGeometry: any;
}> => {
  const routeGeometry = await tomTomService.getRouteGeometry(
    startPoint,
    optimizedWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

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
 * Separates student-only waypoints for DB updates from full waypoints for response
 */
const updateAndBroadcastRoute = async (
  tripId: string,
  routeData: RouteGeometry,
  waypointsWithMetrics: RouteWaypoint[],
): Promise<number> => {
  // Update trip with route data (full route including school if present)
  await trackingRepository.updateTripRouteData(
    tripId,
    routeData,
    routeData.total_distance,
  );

  const studentWaypoints = waypointsWithMetrics.filter(
    (wp) => wp.student_id && wp.student_id[0] !== "SCHOOL",
  );

  const studentUpdates = studentWaypoints.flatMap((wp, idx) => {
    const studentIds = Array.isArray(wp.student_id)
      ? wp.student_id
      : [wp.student_id];

    return studentIds
      .filter((id) => id)
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

  BroadcastService.broadcastRouteCalculated(tripId, {
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
  const { uniqueWaypoints, trip, schoolLocation } =
    await validateAndPrepareRoute(userId, data.trip_id);

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  // For PICKUP: optimize homes, add school at end
  // For DROP: optimize homes from current location (at/near school)
  const waypointsToOptimize = uniqueWaypoints;

  const sequence = calculateOptimalSequence(
    startPoint,
    waypointsToOptimize.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => waypointsToOptimize[idx]);

  // Build final waypoints:
  // PICKUP: optimized homes → school (last)
  // DROP: school (first) → optimized homes
  const finalWaypoints =
    trip.trip_type === TripType.PICKUP && schoolLocation
      ? [...optimizedWaypoints, schoolLocation]
      : trip.trip_type === TripType.DROP && schoolLocation
        ? [schoolLocation, ...optimizedWaypoints]
        : optimizedWaypoints;

  const { waypointsWithMetrics, routeData } =
    await calculateGeometryAndETasHaversine(startPoint, finalWaypoints);

  const updatedCount = await updateAndBroadcastRoute(
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
    message: SUCCESS_MESSAGES.ROUTE.CALCULATED_SUCCESSFULLY,
  };
};

export const calculateOptimalRouteWithTomTom = async (
  userId: string,
  data: RouteCalculationRequest,
): Promise<RouteCalculationResponse> => {
  const { uniqueWaypoints, trip, schoolLocation } =
    await validateAndPrepareRoute(userId, data.trip_id);

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  // For both PICKUP and DROP: optimize student homes from current location
  const waypointsToOptimize = uniqueWaypoints;

  const { sequence } = await tomTomService.calculateOptimalSequenceWithTomTom(
    startPoint,
    waypointsToOptimize.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => waypointsToOptimize[idx]);

  // Build final waypoints:
  // PICKUP: optimized homes → school (last)
  // DROP: school (first) → optimized homes
  const finalWaypoints =
    trip.trip_type === TripType.PICKUP && schoolLocation
      ? [...optimizedWaypoints, schoolLocation]
      : trip.trip_type === TripType.DROP && schoolLocation
        ? [schoolLocation, ...optimizedWaypoints]
        : optimizedWaypoints;

  const { waypointsWithMetrics, routeData } =
    await calculateGeometryAndETasTomTom(startPoint, finalWaypoints);

  const updatedCount = await updateAndBroadcastRoute(
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
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  const trip = await tripRepository.findById(tripId);
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

  if (trip.optimized_route_data?.polyline_encoded) {
    // Decode encoded polyline only for deviation checking (internal use only)
    const routeCoordinates = googleMapsApiService.decodePolylineForDeviation(
      trip.optimized_route_data.polyline_encoded,
    );

    const isWithinCorridor = isPointWithinRouteCorridor(
      { latitude, longitude },
      routeCoordinates,
      200,
    );

    if (!isWithinCorridor) {
      logger.warn(ERROR_MESSAGES.TRACKING.DRIVER_POSITION_OUTSIDE_CORRIDOR);
    }
  }

  const trackingData: Omit<LocationTracking, "_id"> = {
    trip_id: tripId,
    driver_id: driverId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    accuracy: accuracy || 0,
    timestamp: new Date(),
  };

  const result = await trackingRepository.upsertTracking(tripId, trackingData);

  if (!result) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.TRACKING.POSITION_UPDATE_ERROR,
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
  };
};

export const getRouteTracking = async (
  tripId: string,
  limit: number = 100,
): Promise<LocationTracking[]> => {
  const tracking = await trackingRepository.getTrackingByTripId(tripId);
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

export const getLatestDriverPosition = async (
  tripId: string,
): Promise<LocationTracking | null> => {
  const latest = await trackingRepository.getLatestTrackingByTripId(tripId);
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

export const getRouteDetails = async (tripId: string): Promise<any> => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRACKING.TRIP_NOT_FOUND,
    );
  }

  const latestPosition = await getLatestDriverPosition(tripId);
  const tripStudents = await trackingRepository.getTripStudents(tripId);

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

export const cleanOldTrackingData = async (
  daysOld: number = 30,
): Promise<number> => {
  return await trackingRepository.cleanOldTrackingData(daysOld);
};

/**
 * Recalculate route from current position
 * Used when driver changes route or wants alternative
 * Handles both PICKUP (home → school) and DROP (school → home) trips
 */
export const recalculateRoute = async (
  userId: string,
  data: any, // RecalculateRouteRequest
): Promise<any> => {
  // Validate and prepare
  const { uniqueWaypoints, trip, schoolLocation } =
    await validateAndPrepareRoute(userId, data.trip_id);

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  // Optimize only student homes from current location
  const waypointsToOptimize = uniqueWaypoints;

  // Recalculate optimal sequence with new start point using grouped waypoints
  const { sequence } = await tomTomService.calculateOptimalSequenceWithTomTom(
    startPoint,
    waypointsToOptimize.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence.map((idx) => waypointsToOptimize[idx]);

  // Build final waypoints:
  // PICKUP: optimized homes → school (last)
  // DROP: school (first) → optimized homes
  const finalWaypoints =
    trip.trip_type === TripType.PICKUP && schoolLocation
      ? [...optimizedWaypoints, schoolLocation]
      : trip.trip_type === TripType.DROP && schoolLocation
        ? [schoolLocation, ...optimizedWaypoints]
        : optimizedWaypoints;

  // Calculate geometry and ETAs using TomTom version (accurate API-based)
  const { waypointsWithMetrics, routeData } =
    await calculateGeometryAndETasTomTom(startPoint, finalWaypoints);

  await trackingRepository.updateTripRouteData(
    data.trip_id,
    routeData,
    routeData.total_distance,
  );

  const studentUpdates = waypointsWithMetrics
    .filter((wp) => wp.student_id && wp.student_id[0] !== "SCHOOL")
    .flatMap((wp, idx) => {
      const studentIds = Array.isArray(wp.student_id)
        ? wp.student_id
        : [wp.student_id];

      return studentIds
        .filter((id) => id)
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

  BroadcastService.broadcastRouteCalculated(data.trip_id, {
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
