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
import { calculateHaversineDistance } from "@shared/services/geo-util.service";
import { tomTomService } from "@shared/services/tomtom.service";
import { logger } from "@shared/utils";

import { trackingRepository } from "./tracking.repository";
import {
  GroupedWaypoint,
  LocationTracking,
  NavigationInstruction,
  RouteCalculationRequest,
  RouteCalculationResponse,
  RouteDetailsResponse,
  RouteGeometry,
  StudentWaypoint,
} from "./tracking.type";

const getDriverIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });

  return driver ? String(driver._id) : null;
};

// Groups students by parent_id to create unique waypoints per location
// Also tracks school_ids for multi-school parent support
const groupStudentsByParent = (
  students: StudentWaypoint[],
): GroupedWaypoint[] => {
  const grouped = new Map<string, StudentWaypoint[]>();

  for (const student of students) {
    const parentId =
      student.student_parent_id || `default-${student.student_id}`;
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId)!.push(student);
  }

  const uniqueWaypoints: GroupedWaypoint[] = [];
  for (const [parentId, studentList] of grouped.entries()) {
    const firstStudent = studentList[0];

    const studentIds = studentList.map((s) => s.student_id).filter(Boolean);

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

    // Extract all unique schools for students at this location (multi-school parent support)
    const schoolIdsSet = new Set<string>();
    const schoolIdMap: Record<string, string> = {};

    for (const student of studentList) {
      const studentId = student.student_id;
      const schoolId = student.school?.school_id
        ? String(student.school.school_id)
        : undefined;

      if (schoolId) {
        schoolIdsSet.add(schoolId);
        // Map individual student to their school
        if (studentId) {
          schoolIdMap[studentId] = schoolId;
        }
      }
    }

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
      school: firstStudent.school, // Preserve school object from first student
      school_ids: Array.from(schoolIdsSet), // All schools for this location
      school_id_map:
        Object.keys(schoolIdMap).length > 0 ? schoolIdMap : undefined, // Mapping for bulk operations
    });
  }

  return uniqueWaypoints;
};

/**
 * Extract all unique schools from students and create school waypoints
 * Handles cases where students belong to different schools
 * Uses school_id_map from grouped waypoints to correctly identify student->school relationships
 */
const extractUniqueSchoolWaypoints = (
  students: StudentWaypoint[],
): GroupedWaypoint[] => {
  const schoolMap = new Map<
    string,
    {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      address: string;
      studentIds: string[];
    }
  >();

  // Collect all unique schools from students with their student assignments
  for (const student of students) {
    if (student.school && student.school.school_id) {
      const schoolId = String(student.school.school_id);
      const studentIds = [student.student_id];

      if (!schoolMap.has(schoolId)) {
        schoolMap.set(schoolId, {
          id: schoolId,
          name: student.school.school_name || "School",
          latitude: student.school.school_latitude || 0,
          longitude: student.school.school_longitude || 0,
          address:
            student.school.school_address ||
            student.school.school_name ||
            "School",
          studentIds: studentIds,
        });
      } else {
        // Add students to existing school
        const existing = schoolMap.get(schoolId)!;
        existing.studentIds = [
          ...new Set([...existing.studentIds, ...studentIds]),
        ];
      }
    }
  }

  // Create a waypoint for each unique school
  const schoolWaypoints: GroupedWaypoint[] = [];
  for (const [schoolId, schoolData] of schoolMap.entries()) {
    schoolWaypoints.push({
      latitude: schoolData.latitude,
      longitude: schoolData.longitude,
      address: schoolData.address,
      student_id: ["SCHOOL"],
      student_parent_id: "SCHOOL_LOCATION",
      student_names: [schoolData.name],
      school_id: schoolId, // Include school ID for identification
      school_ids: [schoolId], // Consistency: also add to array form for unified handling
    });
  }

  return schoolWaypoints;
};

/**
 * Validate trip ownership and get prepared waypoints
 * Supports multiple schools - extracts all unique schools from students
 * Returns student waypoints grouped by parent with school mapping, and separate school waypoints
 */
const validateAndPrepareRoute = async (
  userId: string,
  tripId: string,
): Promise<{
  driverId: string;
  trip: any;
  uniqueWaypoints: GroupedWaypoint[];
  schoolWaypoints: GroupedWaypoint[];
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

  // Extract all unique schools from students (supports multiple schools)
  const schoolWaypoints = extractUniqueSchoolWaypoints(waypointsToOptimize);

  return { driverId, trip, uniqueWaypoints, schoolWaypoints };
};

/**
 * Calculate route using TomTom API
 * OPTIMIZED: Single API call returns both route geometry AND navigation instructions
 * Previously made 2 API calls - now makes 1
 * Uses TomTom response directly - NO manual distance/duration calculations
 */
const calculateRouteWithTomTom = async (
  startPoint: { latitude: number; longitude: number },
  optimizedWaypoints: GroupedWaypoint[],
): Promise<{
  waypointsWithMetrics: GroupedWaypoint[];
  routeData: RouteGeometry;
  navigationInstructions: NavigationInstruction[];
}> => {
  // Get route geometry AND navigation instructions in single API call
  const { routeGeometry, navigationInstructions } =
    await tomTomService.getRouteGeometryWithInstructions(
      startPoint,
      optimizedWaypoints.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
      })),
    );

  // Calculate waypoint metrics using TomTom's actual leg data (no Haversine)
  const waypointsWithMetrics = routeGeometry.legs.map((leg, idx) => {
    const waypoint = optimizedWaypoints[idx];
    const cumulativeDuration = routeGeometry.legs
      .slice(0, idx + 1)
      .reduce((sum, l) => sum + l.duration, 0);

    return {
      ...waypoint,
      distance_from_previous: leg.distance / 1000, // TomTom meters → km
      duration_from_previous: leg.duration, // TomTom seconds (with traffic)
      estimated_arrival_time: new Date(Date.now() + cumulativeDuration * 1000),
    };
  });

  // Build route data using TomTom polyline points (NO SLERP interpolation)
  const routeData: RouteGeometry = {
    waypoints: waypointsWithMetrics,
    total_distance: routeGeometry.totalDistance / 1000, // meters → km
    total_duration: routeGeometry.totalDuration, // TomTom seconds
    coordinates: routeGeometry.coordinates, // Full route polyline
    legs: routeGeometry.legs.map((leg) => ({
      distance: leg.distance / 1000, // meters → km
      duration: leg.duration,
      coordinates: leg.coordinates, // Per-segment coordinates
    })),
    navigation_instructions: navigationInstructions,
    route_type: routeGeometry.routeType,
    has_alternatives: routeGeometry.hasAlternatives,
    alternative_routes_count: routeGeometry.alternativeRoutesCount,
    traffic_delay: routeGeometry.trafficDelay,
    route_confidence: routeGeometry.confidence,
  };

  return { waypointsWithMetrics, routeData, navigationInstructions };
};

/**
 * Commit trip route plan to database and broadcast to WebSocket subscribers
 * Finalizes route calculation after optimization
 * Separates student-only waypoints for DB updates from full waypoints for response
 */
const commitTripRoute = async (
  tripId: string,
  routeData: RouteGeometry,
  waypointsWithMetrics: GroupedWaypoint[],
): Promise<number> => {
  // Update trip with route data (full route including school if present)
  await trackingRepository.updateTripRouteData(
    tripId,
    routeData,
    routeData.total_distance,
  );

  const isSchoolWaypoint = (
    studentId: string | string[] | undefined,
  ): boolean => {
    if (!studentId) return false;
    if (Array.isArray(studentId)) {
      return studentId[0] === "SCHOOL";
    }
    return studentId === "SCHOOL";
  };

  const studentWaypoints = waypointsWithMetrics.filter(
    (wp) => !isSchoolWaypoint(wp.student_id),
  );

  const studentUpdates = studentWaypoints.flatMap((wp, idx) => {
    const studentIds = Array.isArray(wp.student_id)
      ? wp.student_id
      : [wp.student_id];
    return studentIds
      .filter((id: string) => id)
      .map((id: string) => ({
        student_id: id,
        sequence_order: idx + 1,
        estimated_arrival_time: wp.estimated_arrival_time || new Date(),
      }));
  });

  const updatedCount = await trackingRepository.updateTripStudentsSequence(
    tripId,
    studentUpdates,
  );

  // Broadcast includes navigation instructions and route clarity metadata
  BroadcastService.broadcastRouteCalculated(tripId, {
    waypoints: waypointsWithMetrics,
    total_distance: routeData.total_distance,
    total_duration: routeData.total_duration,
    coordinates: routeData.coordinates,
    legs: routeData.legs,
    navigation_instructions: routeData.navigation_instructions,
    route_type: routeData.route_type,
    has_alternatives: routeData.has_alternatives,
    alternative_routes_count: routeData.alternative_routes_count,
    traffic_delay: routeData.traffic_delay,
    route_confidence: routeData.route_confidence,
  });

  return updatedCount;
};

/**
 * Calculate route with TomTom Matrix API optimization
 * Used for both initial TomTom-optimized calculation and recalculation from new position
 * Consolidates logic from calculateOptimalRouteWithTomTom and recalculateRoute
 */
const calculateOptimalRoute = async (
  userId: string,
  data: RouteCalculationRequest,
): Promise<RouteCalculationResponse> => {
  const { uniqueWaypoints, trip, schoolWaypoints } =
    await validateAndPrepareRoute(userId, data.trip_id);

  const startPoint = {
    latitude: data.current_latitude,
    longitude: data.current_longitude,
  };

  const waypointsToOptimize = uniqueWaypoints;

  // Use TomTom Matrix API for optimal sequencing
  const { sequence } = await tomTomService.calculateOptimalSequenceWithTomTom(
    startPoint,
    waypointsToOptimize.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
  );

  const optimizedWaypoints = sequence
    .filter((idx) => idx != null && waypointsToOptimize[idx] != null)
    .map((idx) => waypointsToOptimize[idx]);

  // Build final waypoints:
  // PICKUP: optimized homes → all schools (last)
  // DROP: all schools (first) → optimized homes
  // If multiple schools exist, all are included in the route
  let finalWaypoints: GroupedWaypoint[] = optimizedWaypoints;
  if (schoolWaypoints && schoolWaypoints.length > 0) {
    finalWaypoints =
      trip.trip_type === TripType.PICKUP
        ? [...optimizedWaypoints, ...schoolWaypoints]
        : [...schoolWaypoints, ...optimizedWaypoints];
  }

  const { waypointsWithMetrics, routeData } = await calculateRouteWithTomTom(
    startPoint,
    finalWaypoints,
  );

  const updatedCount = await commitTripRoute(
    data.trip_id,
    routeData,
    waypointsWithMetrics,
  );

  return {
    _id: trip._id?.toString(),
    trip_id: data.trip_id,
    route_geometry: routeData,
    trip_students_updated: updatedCount,
    message: SUCCESS_MESSAGES.ROUTE.TOMTOM_ROUTE_CALCULATED,
  };
};

export const calculateOptimalRouteWithTomTom = calculateOptimalRoute;

export const recordLiveLocation = async (
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

  if (
    trip.optimized_route_data?.coordinates &&
    trip.optimized_route_data.coordinates.length > 0
  ) {
    // Check if driver position is within 200m of any route coordinate
    const routeCoordinates = trip.optimized_route_data.coordinates;
    const bufferKm = 0.2; // 200 meters

    let isWithinCorridor = false;
    for (const routePoint of routeCoordinates) {
      const distance = calculateHaversineDistance(
        latitude,
        longitude,
        routePoint[0],
        routePoint[1],
      );
      if (distance <= bufferKm) {
        isWithinCorridor = true;
        break;
      }
    }

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

export const getRouteDetails = async (
  tripId: string,
): Promise<RouteDetailsResponse> => {
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
    total_distance: trip.total_distance || 0,
    optimized_route_data: trip.optimized_route_data || null,
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
 * Now uses consolidated calculateOptimalRoute logic
 */
export const recalculateRoute = async (
  userId: string,
  data: RouteCalculationRequest,
): Promise<RouteCalculationResponse> => {
  // Use the same consolidated optimal route calculation
  const result = await calculateOptimalRoute(userId, data);

  // Add recalculated_at metadata
  return {
    ...result,
    message: SUCCESS_MESSAGES.ROUTE.RECALCULATED_SUCCESSFULLY,
  };
};

/**
 * Get alternative routes for a trip when driver is confused or wants options
 * Returns up to 2 alternative routes with distance/duration comparisons
 * Helps clarify multiple ways shown on map
 */
export const getAlternativeRoutesForTrip = async (
  tripId: string,
  currentLatitude: number,
  currentLongitude: number,
): Promise<
  Array<{
    route_id: string;
    is_primary: boolean;
    total_distance: number; // in km
    total_duration: number; // in seconds
    distance_difference?: number; // difference from primary in km
    duration_difference?: number; // difference from primary in seconds
    coordinates: [number, number][];
    confidence: "high" | "medium" | "low";
  }>
> => {
  const trip = await tripRepository.findById(tripId);
  if (!trip) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRACKING.TRIP_NOT_FOUND,
    );
  }

  if (!trip.optimized_route_data?.coordinates) {
    return [];
  }

  const primaryRoute = trip.optimized_route_data;
  const primaryDistance = primaryRoute.total_distance;
  const primaryDuration = primaryRoute.total_duration;

  // Get alternative routes from TomTom (up to 2 alternatives)
  const alternatives = await tomTomService.getAlternativeRoutes(
    { latitude: currentLatitude, longitude: currentLongitude },
    {
      latitude:
        primaryRoute.waypoints[primaryRoute.waypoints.length - 1]?.latitude ||
        0,
      longitude:
        primaryRoute.waypoints[primaryRoute.waypoints.length - 1]?.longitude ||
        0,
    },
    2,
  );

  const routes = [
    {
      route_id: "primary",
      is_primary: true,
      total_distance: primaryDistance,
      total_duration: primaryDuration,
      distance_difference: 0, // Primary route has 0 difference
      duration_difference: 0, // Primary route has 0 difference
      coordinates: primaryRoute.coordinates,
      confidence: primaryRoute.route_confidence || "high",
    },
  ];

  // Add alternative routes with comparison metrics
  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i];
    routes.push({
      route_id: `alternative_${i + 1}`,
      is_primary: false,
      total_distance: alt.totalDistance / 1000, // meters to km
      total_duration: alt.totalDuration,
      distance_difference: alt.totalDistance / 1000 - primaryDistance,
      duration_difference: alt.totalDuration - primaryDuration,
      coordinates: alt.coordinates,
      confidence: "medium",
    });
  }

  logger.info("Retrieved alternative routes for trip", {
    tripId,
    primaryDistance,
    alternativesCount: routes.length - 1,
  });

  return routes;
};
