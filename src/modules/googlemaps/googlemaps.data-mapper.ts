/**
 * Pure data transformation functions for the Google Maps module.
 * No API calls, no DB queries — just data in → data out.
 */
import { DirectionsResponse } from "@googlemaps/google-maps-services-js";

import {
  GoogleMapsRouteGeometry,
  GoogleMapsRouteWaypoint,
} from "./googlemaps.type";

// ============================================
// Google API response parsing
// ============================================

export interface ParsedRouteResult {
  sequence: number[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  polyline_encoded: string;
  legs: Array<{ distance: number; duration: number }>;
}

/**
 * Parse raw Google Directions API response into our domain format.
 * Extracts: waypoint sequence, per-leg distance/duration, encoded polyline, totals.
 * Uses overview_polyline for the complete route (don't concatenate step polylines—it breaks encoding).
 */
export const parseDirectionsResponse = (
  response: DirectionsResponse,
  waypointCount: number,
): ParsedRouteResult => {
  const route = response.data.routes[0];

  // Build full sequence: reordered intermediates + last waypoint (destination)
  const waypointOrder = route.waypoint_order || [];
  const sequence =
    waypointCount === 1 ? [0] : [...waypointOrder, waypointCount - 1];

  // Extract per-leg metrics from Google's response
  const legs: Array<{ distance: number; duration: number }> = [];

  for (const leg of route.legs) {
    legs.push({
      distance: leg.distance?.value || 0,
      duration: (leg.duration_in_traffic?.value ?? leg.duration?.value) || 0,
    });
  }

  // Use overview_polyline for the complete route (preferred over concatenating steps)
  const polyline_encoded = route.overview_polyline?.points || "";

  const totalDistance = legs.reduce((sum, l) => sum + l.distance, 0);
  const totalDuration = legs.reduce((sum, l) => sum + l.duration, 0);

  return { sequence, totalDistance, totalDuration, polyline_encoded, legs };
};

/**
 * Decode Google Maps encoded polyline into coordinate pairs.
 * Used internally for corridor deviation checking — frontend handles its own decoding.
 */
export const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

// ============================================
// Domain data transformations
// ============================================

/**
 * Group students by parent so siblings at the same address become a single waypoint.
 */
export const groupStudentsByParent = (
  students: GoogleMapsRouteWaypoint[],
): GoogleMapsRouteWaypoint[] => {
  const grouped = new Map<string, GoogleMapsRouteWaypoint[]>();

  for (const student of students) {
    const studentIdValue = Array.isArray(student.student_id)
      ? student.student_id[0]
      : student.student_id;
    const parentId = student.student_parent_id || `default-${studentIdValue}`;
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId)!.push(student);
  }

  const uniqueWaypoints: GoogleMapsRouteWaypoint[] = [];
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
      student_photo_urls: studentPhotos.length > 0 ? studentPhotos : undefined,
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
 * Map Google API leg data onto waypoints to compute cumulative ETAs.
 * Each leg corresponds to one waypoint in order.
 */
export const mapLegsToWaypoints = (
  waypoints: GoogleMapsRouteWaypoint[],
  legs: Array<{ distance: number; duration: number }>,
): GoogleMapsRouteWaypoint[] => {
  const now = new Date();
  let cumulativeDuration = 0;
  return waypoints.map((wp, idx) => {
    const leg = legs[idx];
    if (leg) {
      cumulativeDuration += leg.duration;
      return {
        ...wp,
        distance_from_previous: leg.distance / 1000, // meters → km
        duration_from_previous: leg.duration, // seconds (traffic-aware from Google)
        estimated_arrival_time: new Date(
          now.getTime() + cumulativeDuration * 1000,
        ),
      };
    }
    return wp;
  });
};

/**
 * Build the route geometry object from Google API results + mapped waypoints.
 */
export const buildRouteData = (
  waypointsWithMetrics: GoogleMapsRouteWaypoint[],
  routeResult: {
    totalDistance: number;
    totalDuration: number;
    polyline_encoded: string;
  },
): GoogleMapsRouteGeometry => ({
  waypoints: waypointsWithMetrics,
  total_distance: routeResult.totalDistance / 1000, // meters → km
  total_duration: routeResult.totalDuration, // seconds
  polyline_encoded: routeResult.polyline_encoded,
});

/**
 * Build student sequence updates for DB persistence.
 * Filters out school waypoints and flattens grouped student IDs.
 */
export const buildStudentUpdates = (
  waypointsWithMetrics: GoogleMapsRouteWaypoint[],
): Array<{
  student_id: string;
  sequence_order: number;
  estimated_arrival_time: Date;
}> => {
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

  return studentWaypoints.flatMap((wp, idx) => {
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
};

/**
 * Build parent notification groups from trip students and recalculated waypoints.
 * Groups students by parent so each parent gets one notification with all their children's ETAs.
 */
export const buildParentNotificationGroups = (
  tripStudents: GoogleMapsRouteWaypoint[],
  recalculatedWaypoints: GoogleMapsRouteWaypoint[],
): Map<
  string,
  {
    parentUserId: string;
    students: { studentId: string; studentName: string }[];
    etas: { studentId: string; eta: Date }[];
  }
> => {
  const parentGroups = new Map<
    string,
    {
      parentUserId: string;
      students: { studentId: string; studentName: string }[];
      etas: { studentId: string; eta: Date }[];
    }
  >();

  for (const student of tripStudents) {
    const parentId = student.student_parent_id;
    if (!parentId || parentId === "SCHOOL_LOCATION") continue;

    if (!parentGroups.has(parentId)) {
      parentGroups.set(parentId, {
        parentUserId: student.parent_user_id || "",
        students: [],
        etas: [],
      });
    }

    const group = parentGroups.get(parentId)!;
    const studentIds = Array.isArray(student.student_id)
      ? student.student_id
      : [student.student_id];
    const studentName = student.student_name || "Student";

    for (const sId of studentIds) {
      group.students.push({ studentId: sId, studentName });

      const waypoint = recalculatedWaypoints.find(
        (wp: GoogleMapsRouteWaypoint) =>
          Array.isArray(wp.student_id)
            ? wp.student_id.includes(sId)
            : wp.student_id === sId,
      );
      if (waypoint?.estimated_arrival_time) {
        group.etas.push({
          studentId: sId,
          eta: waypoint.estimated_arrival_time,
        });
      }
    }
  }

  return parentGroups;
};
