import axios from "axios";

import { logger } from "@shared/utils";

interface TomTomGuidanceInstruction {
  routeOffsetInMeters: number;
  travelTimeInSeconds: number;
  point: { latitude: number; longitude: number };
  instructionType: string;
  message: string;
  street?: string;
  junctionType?: string;
  turnAngleInDecimalDegrees?: number;
  possibleCombineWithNext?: boolean;
}

interface TomTomRouteResponse {
  routes: Array<{
    summary: {
      lengthInMeters: number;
      travelTimeInSeconds: number;
      trafficDelayInSeconds: number;
    };
    legs: Array<{
      summary: {
        lengthInMeters: number;
        travelTimeInSeconds: number;
      };
      points: Array<{
        latitude: number;
        longitude: number;
      }>;
    }>;
    guidance?: {
      instructions: TomTomGuidanceInstruction[];
      instructionGroups?: Array<{
        firstInstructionIndex: number;
        lastInstructionIndex: number;
        groupMessage: string;
        groupLengthInMeters: number;
      }>;
    };
  }>;
  optimizedWaypoints?: Array<{
    providedIndex: number;
    optimizedIndex: number;
  }>;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

class TomTomService {
  private apiKey: string;
  private baseUrl: string = "https://api.tomtom.com";

  constructor() {
    this.apiKey = process.env.TOMTOM_API_KEY || "";
    if (!this.apiKey) {
      logger.warn("TOMTOM_API_KEY not configured");
    }
  }

  /**
   * Calculate optimal sequence using TomTom API with computeBestOrder
   * TomTom solves the TSP (Travelling Salesman Problem) server-side
   * Returns optimal order of waypoints to minimize total travel time
   */
  async calculateOptimalSequenceWithTomTom(
    startPoint: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    sequence: number[];
    distances: number[];
    totalDistance: number;
  }> {
    try {
      if (waypoints.length === 0) {
        return { sequence: [], distances: [], totalDistance: 0 };
      }

      if (waypoints.length === 1) {
        return { sequence: [0], distances: [0], totalDistance: 0 };
      }

      const allPoints = [startPoint, ...waypoints];
      const pointsString = allPoints
        .map((p) => `${p.latitude},${p.longitude}`)
        .join(":");

      const url = `${this.baseUrl}/routing/1/calculateRoute/${pointsString}/json`;
      const response = await axios.get<TomTomRouteResponse>(url, {
        params: {
          key: this.apiKey,
          computeBestOrder: true,
        },
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error("No route found for sequence optimization");
      }

      const route = response.data.routes[0];

      // Extract distances from each leg
      const distances: number[] = route.legs.map(
        (leg) => leg.summary.lengthInMeters,
      );

      // Use TomTom's optimizedWaypoints for proper TSP-solved order
      // optimizedWaypoints maps providedIndex → optimizedIndex (0-based, relative to waypoints only, not start)
      let sequence: number[];
      if (
        response.data.optimizedWaypoints &&
        response.data.optimizedWaypoints.length > 0
      ) {
        // Build sequence: for each optimized position, find which original waypoint goes there
        const optimizedMap = response.data.optimizedWaypoints;
        sequence = Array.from({ length: waypoints.length }, (_, i) => i);
        for (const wp of optimizedMap) {
          sequence[wp.optimizedIndex] = wp.providedIndex;
        }
      } else {
        // Fallback: use leg order as-is (waypoints in order they were given)
        sequence = waypoints.map((_, i) => i);
      }

      const totalDistance = distances.reduce(
        (a: number, b: number) => a + b,
        0,
      );

      return {
        sequence,
        distances,
        totalDistance,
      };
    } catch (error) {
      logger.error("TomTom route optimization error:", { error });
      throw error;
    }
  }

  /**
   * Get alternative routes between two points
   */
  async getAlternativeRoutes(
    startPoint: Coordinate,
    endPoint: Coordinate,
    maxRoutes: number = 2,
  ): Promise<
    Array<{
      totalDistance: number;
      totalDuration: number;
      coordinates: [number, number][];
      legs: Array<{ distance: number; duration: number }>;
    }>
  > {
    try {
      const pointsString = `${startPoint.latitude},${startPoint.longitude}:${endPoint.latitude},${endPoint.longitude}`;
      const url = `${this.baseUrl}/routing/1/calculateRoute/${pointsString}/json`;

      const response = await axios.get<TomTomRouteResponse>(url, {
        params: {
          key: this.apiKey,
          alternatives: true,
        },
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        return [];
      }

      // Return up to maxRoutes (excluding the first one which is the main route)
      return response.data.routes.slice(1, maxRoutes + 1).map((route) => ({
        totalDistance: route.summary.lengthInMeters,
        totalDuration: route.summary.travelTimeInSeconds,
        coordinates: route.legs.flatMap((leg) =>
          leg.points.map((p) => [p.latitude, p.longitude] as [number, number]),
        ),
        legs: route.legs.map((leg) => ({
          distance: leg.summary.lengthInMeters,
          duration: leg.summary.travelTimeInSeconds,
        })),
      }));
    } catch (error) {
      logger.error("Error fetching alternative routes:", { error });
      return [];
    }
  }

  /**
   * Get route geometry AND navigation instructions in single API call
   * Combines what was previously two separate API calls
   * OPTIMIZED: Single call returns route data + instructions
   */
  async getRouteGeometryWithInstructions(
    startPoint: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    routeGeometry: {
      totalDistance: number;
      totalDuration: number;
      coordinates: [number, number][];
      legs: Array<{
        distance: number;
        duration: number;
        coordinates: [number, number][];
      }>;
      routeType: "primary" | "alternative";
      hasAlternatives: boolean;
      alternativeRoutesCount: number;
      trafficDelay?: number;
      confidence: "high" | "medium" | "low";
    };
    navigationInstructions: Array<{
      route_index: number;
      instruction: string;
      distance_delta: number; // Distance from previous instruction (in km)
      duration_delta: number; // Duration from previous instruction (in seconds)
      distance_from_start: number; // Cumulative distance from route start (in km)
      duration_from_start: number; // Cumulative time from route start (in seconds)
      coordinates: [number, number][];
    }>;
  }> {
    try {
      const allPoints = [startPoint, ...waypoints];
      const pointsString = allPoints
        .map((p) => `${p.latitude},${p.longitude}`)
        .join(":");

      const url = `${this.baseUrl}/routing/1/calculateRoute/${pointsString}/json`;

      const response = await axios.get<TomTomRouteResponse>(url, {
        params: {
          key: this.apiKey,
          instructionsType: "text",
        },
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = response.data.routes[0];
      const totalDistance = route.summary.lengthInMeters;
      const totalDuration = route.summary.travelTimeInSeconds;
      const trafficDelay = route.summary.trafficDelayInSeconds || 0;

      // Check if alternatives exist
      const hasAlternatives = response.data.routes.length > 1;
      const alternativeRoutesCount = Math.max(
        0,
        response.data.routes.length - 1,
      );

      // Determine confidence based on traffic
      const delayRatio = trafficDelay / totalDuration;
      let confidence: "high" | "medium" | "low" = "high";
      if (delayRatio > 0.3) confidence = "low";
      else if (delayRatio > 0.15) confidence = "medium";

      // Build coordinates and legs
      const coordinates: [number, number][] = [];
      const legs = [];

      // Cumulative distance per leg (for mapping guidance instructions to legs)
      const legCumulativeDistances: number[] = [];
      let cumulativeDistance = 0;

      for (let legIdx = 0; legIdx < route.legs.length; legIdx++) {
        const leg = route.legs[legIdx];

        cumulativeDistance += leg.summary.lengthInMeters;
        legCumulativeDistances.push(cumulativeDistance);

        // Build per-leg coordinates
        const legCoordinates: [number, number][] = [];

        const startWaypoint = allPoints[legIdx];
        legCoordinates.push([startWaypoint.latitude, startWaypoint.longitude]);

        if (leg.points && leg.points.length > 0) {
          for (const point of leg.points) {
            const coord: [number, number] = [point.latitude, point.longitude];
            if (
              coord[0] !== startWaypoint.latitude ||
              coord[1] !== startWaypoint.longitude
            ) {
              legCoordinates.push(coord);
            }
          }
        }

        // Ensure connectivity to end waypoint
        const endWaypoint = allPoints[legIdx + 1];
        if (endWaypoint) {
          const lastCoord = legCoordinates[legCoordinates.length - 1];
          if (
            endWaypoint.latitude !== lastCoord[0] ||
            endWaypoint.longitude !== lastCoord[1]
          ) {
            legCoordinates.push([endWaypoint.latitude, endWaypoint.longitude]);
          }
        }

        legs.push({
          distance: leg.summary.lengthInMeters,
          duration: leg.summary.travelTimeInSeconds,
          coordinates: legCoordinates,
        });

        // Add to full route coordinates
        coordinates.push(...legCoordinates);
      }

      // Parse real turn-by-turn instructions from TomTom guidance
      const navigationInstructions = this.buildNavigationInstructions(
        route,
        legCumulativeDistances,
      );

      return {
        routeGeometry: {
          totalDistance,
          totalDuration,
          coordinates,
          legs,
          routeType: "primary",
          hasAlternatives,
          alternativeRoutesCount,
          trafficDelay,
          confidence,
        },
        navigationInstructions,
      };
    } catch (error) {
      logger.error("Error getting route geometry with instructions:", {
        error,
      });
      throw error;
    }
  }

  /**
   * Build navigation instructions from TomTom guidance data
   * Maps guidance instructions to route legs using routeOffsetInMeters
   * Emits deltas between consecutive instructions for client consumption
   * Falls back to generic per-leg instructions if guidance is not available
   */
  private buildNavigationInstructions(
    route: TomTomRouteResponse["routes"][0],
    legCumulativeDistances: number[],
  ): Array<{
    route_index: number;
    instruction: string;
    distance_delta: number;
    duration_delta: number;
    distance_from_start: number;
    duration_from_start: number;
    coordinates: [number, number][];
  }> {
    const instructions: Array<{
      route_index: number;
      instruction: string;
      distance_delta: number;
      duration_delta: number;
      distance_from_start: number;
      duration_from_start: number;
      coordinates: [number, number][];
    }> = [];

    if (route.guidance && route.guidance.instructions.length > 0) {
      // Map each TomTom guidance instruction to the correct leg
      for (let i = 0; i < route.guidance.instructions.length; i++) {
        const gi = route.guidance.instructions[i];
        const prevGi = i > 0 ? route.guidance.instructions[i - 1] : null;

        // Determine which leg this instruction belongs to
        let legIndex = 0;
        for (let j = 0; j < legCumulativeDistances.length; j++) {
          if (gi.routeOffsetInMeters <= legCumulativeDistances[j]) {
            legIndex = j;
            break;
          }
        }
        // If offset exceeds all legs, use last leg
        if (
          gi.routeOffsetInMeters >
          legCumulativeDistances[legCumulativeDistances.length - 1]
        ) {
          legIndex = legCumulativeDistances.length - 1;
        }

        // Calculate delta from previous instruction (or 0 for first)
        const distanceDelta = prevGi
          ? (gi.routeOffsetInMeters - prevGi.routeOffsetInMeters) / 1000
          : gi.routeOffsetInMeters / 1000;
        const durationDelta = prevGi
          ? gi.travelTimeInSeconds - prevGi.travelTimeInSeconds
          : gi.travelTimeInSeconds;

        instructions.push({
          route_index: legIndex,
          instruction: gi.message,
          distance_delta: distanceDelta,
          duration_delta: durationDelta,
          distance_from_start: gi.routeOffsetInMeters / 1000,
          duration_from_start: gi.travelTimeInSeconds,
          coordinates: [[gi.point.latitude, gi.point.longitude]],
        });
      }
    } else {
      // Fallback: generate per-leg instructions when guidance is unavailable
      for (let legIdx = 0; legIdx < route.legs.length; legIdx++) {
        const leg = route.legs[legIdx];

        // Calculate cumulative distance and duration up to this leg
        let cumulativeDistance = 0;
        let cumulativeDuration = 0;
        for (let j = 0; j <= legIdx; j++) {
          cumulativeDistance += route.legs[j].summary.lengthInMeters;
          cumulativeDuration += route.legs[j].summary.travelTimeInSeconds;
        }

        const distanceDelta = leg.summary.lengthInMeters / 1000;
        const durationDelta = leg.summary.travelTimeInSeconds;

        instructions.push({
          route_index: legIdx,
          instruction: `Navigate to waypoint ${legIdx + 1}`,
          distance_delta: distanceDelta,
          duration_delta: durationDelta,
          distance_from_start: cumulativeDistance / 1000,
          duration_from_start: cumulativeDuration,
          coordinates: leg.points.map(
            (p) => [p.latitude, p.longitude] as [number, number],
          ),
        });
      }
    }

    return instructions;
  }

  /**
   * Validate TomTom API is accessible
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search/2/nearbySearch/.json`,
        {
          params: {
            key: this.apiKey,
            lat: 28.6139,
            lon: 77.209,
          },
        },
      );
      return response.status === 200;
    } catch (err) {
      logger.error("Error validating TomTom API key:", { err });
      return false;
    }
  }
}

export const tomTomService = new TomTomService();
