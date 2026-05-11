import axios from "axios";

import { logger } from "@shared/utils";

import {
  AlternativeRoute,
  Coordinate,
  IRoutingProvider,
  NavigationInstruction,
  RouteGeometry,
} from "./routing-interfaces";

interface HereSection {
  type: string;
  summary: {
    length: number;
    duration: number;
    baseDuration: number;
  };
  polyline: string;
  actions?: Array<{
    action: string;
    instruction: string;
    offset: number;
    duration: number;
    length: number;
  }>;
}

interface HereRouteResponse {
  routes: Array<{
    sections: HereSection[];
  }>;
}

// HERE flexipolyline format reference: https://github.com/heremaps/flexible-polyline
// Uses URL-safe base-64 alphabet (A-Z, a-z, 0-9, -, _) — NOT Google polyline's "+63" alphabet.
// BigInt is required because varint payloads can exceed 32 bits at high precisions.
const FLEXI_FORMAT_VERSION = 1n;

// Decoding table indexed by (charCode - 45). -1 = invalid character.
const FLEXI_DECODING_TABLE = [
  62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, -1, -1, -1, -1, 63, -1, 26, 27, 28, 29, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
];

function flexiDecodeUnsignedValues(encoded: string): bigint[] {
  const out: bigint[] = [];
  let result = 0n;
  let shift = 0n;

  for (let i = 0; i < encoded.length; i++) {
    const tableIdx = encoded.charCodeAt(i) - 45;
    const v =
      tableIdx >= 0 && tableIdx < FLEXI_DECODING_TABLE.length
        ? FLEXI_DECODING_TABLE[tableIdx]
        : -1;
    if (v < 0) throw new Error("Invalid flexipolyline character");

    const value = BigInt(v);
    result |= (value & 0x1fn) << shift;
    if ((value & 0x20n) !== 0n) {
      shift += 5n;
    } else {
      out.push(result);
      result = 0n;
      shift = 0n;
    }
  }

  if (shift !== 0n) throw new Error("Truncated flexipolyline");
  return out;
}

function flexiToSigned(unsigned: bigint): bigint {
  // Zigzag: even -> positive, odd -> negative.
  return unsigned & 1n ? ~(unsigned >> 1n) : unsigned >> 1n;
}

function decodeFlexiPolyline(encoded: string): [number, number][] {
  if (!encoded || encoded.length === 0) return [];

  const values = flexiDecodeUnsignedValues(encoded);
  if (values.length < 2) return [];

  if (values[0] !== FLEXI_FORMAT_VERSION) {
    logger.warn("Unexpected flexipolyline version", {
      version: values[0].toString(),
    });
  }

  const header = Number(values[1]);
  const precision = header & 0x0f;
  const thirdDim = (header >> 4) & 0x07;
  const factor = Math.pow(10, precision);

  // Each coordinate consumes 2 values (or 3 if a third dimension is present).
  const stride = thirdDim === 0 ? 2 : 3;

  let lat = 0n;
  let lng = 0n;
  const coords: [number, number][] = [];

  for (let i = 2; i + stride - 1 < values.length; i += stride) {
    lat += flexiToSigned(values[i]);
    lng += flexiToSigned(values[i + 1]);
    coords.push([Number(lat) / factor, Number(lng) / factor]);
  }

  return coords;
}

// Nearest-neighbour greedy TSP — adequate for <20 waypoints.
function nearestNeighbourSequence(
  start: Coordinate,
  waypoints: Coordinate[],
): number[] {
  const remaining = waypoints.map((_, i) => i);
  const sequence: number[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const wp = waypoints[remaining[i]];
      const dist =
        Math.pow(wp.latitude - current.latitude, 2) +
        Math.pow(wp.longitude - current.longitude, 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const chosen = remaining.splice(nearestIdx, 1)[0];
    sequence.push(chosen);
    current = waypoints[chosen];
  }

  return sequence;
}

class HereMapsService implements IRoutingProvider {
  private apiKey: string;
  private baseUrl = "https://router.hereapi.com";

  constructor() {
    this.apiKey = process.env.HERE_API_KEY || "";
    if (!this.apiKey) {
      logger.warn("HERE_API_KEY not configured");
    }
  }

  async calculateOptimalSequence(
    start: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    sequence: number[];
    distances: number[];
    totalDistance: number;
  }> {
    if (waypoints.length === 0)
      return { sequence: [], distances: [], totalDistance: 0 };
    if (waypoints.length === 1)
      return { sequence: [0], distances: [0], totalDistance: 0 };

    // HereMaps has no server-side TSP solver — use nearest-neighbour greedy.
    const sequence = nearestNeighbourSequence(start, waypoints);

    // Fetch the route in the solved order to get accurate per-leg distances.
    const ordered = [start, ...sequence.map((i) => waypoints[i])];
    const origin = `${ordered[0].latitude},${ordered[0].longitude}`;
    const destination = `${ordered[ordered.length - 1].latitude},${ordered[ordered.length - 1].longitude}`;
    const via = ordered
      .slice(1, -1)
      .map((c) => `${c.latitude},${c.longitude}`)
      .join("&via=");

    try {
      const params: Record<string, string> = {
        apiKey: this.apiKey,
        transportMode: "car",
        origin,
        destination,
        return: "summary",
      };

      const url =
        via.length > 0
          ? `${this.baseUrl}/v8/routes?via=${via}`
          : `${this.baseUrl}/v8/routes`;

      const response = await axios.get<HereRouteResponse>(url, { params });

      const sections = response.data.routes?.[0]?.sections ?? [];
      const distances = sections.map((s) => s.summary.length);
      const totalDistance = distances.reduce((a, b) => a + b, 0);

      return { sequence, distances, totalDistance };
    } catch (error) {
      logger.error("HereMaps sequence optimization error:", { error });
      throw error;
    }
  }

  async getRouteGeometryWithInstructions(
    start: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    routeGeometry: RouteGeometry;
    navigationInstructions: NavigationInstruction[];
  }> {
    try {
      const allPoints = [start, ...waypoints];
      const origin = `${allPoints[0].latitude},${allPoints[0].longitude}`;
      const destination = `${allPoints[allPoints.length - 1].latitude},${allPoints[allPoints.length - 1].longitude}`;
      const viaPoints = allPoints
        .slice(1, -1)
        .map((c) => `${c.latitude},${c.longitude}`);

      const params: Record<string, string> = {
        apiKey: this.apiKey,
        transportMode: "car",
        origin,
        destination,
        return: "summary,polyline,actions,instructions",
      };

      let url = `${this.baseUrl}/v8/routes`;
      if (viaPoints.length > 0) {
        url += `?via=${viaPoints.join("&via=")}`;
      }

      const response = await axios.get<HereRouteResponse>(url, { params });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error("No route found from HereMaps");
      }

      const route = response.data.routes[0];
      const sections = route.sections;

      let totalDistance = 0;
      let totalDuration = 0;
      let baseDuration = 0;
      const coordinates: [number, number][] = [];
      const legs = [];

      for (const section of sections) {
        totalDistance += section.summary.length;
        totalDuration += section.summary.duration;
        baseDuration += section.summary.baseDuration;

        const legCoords = decodeFlexiPolyline(section.polyline);
        coordinates.push(...legCoords);

        legs.push({
          distance: section.summary.length,
          duration: section.summary.duration,
          coordinates: legCoords,
        });
      }

      const trafficDelay = Math.max(0, totalDuration - baseDuration);
      const delayRatio = trafficDelay / totalDuration;
      let confidence: "high" | "medium" | "low" = "high";
      if (delayRatio > 0.3) confidence = "low";
      else if (delayRatio > 0.15) confidence = "medium";

      const routeGeometry: RouteGeometry = {
        totalDistance,
        totalDuration,
        coordinates,
        legs,
        routeType: "primary",
        hasAlternatives: false,
        alternativeRoutesCount: 0,
        trafficDelay,
        confidence,
      };

      const navigationInstructions = this.buildNavigationInstructions(sections);

      return { routeGeometry, navigationInstructions };
    } catch (error) {
      logger.error("HereMaps route geometry error:", { error });
      throw error;
    }
  }

  async getAlternativeRoutes(
    start: Coordinate,
    end: Coordinate,
    maxRoutes = 2,
  ): Promise<AlternativeRoute[]> {
    try {
      const params: Record<string, string | number> = {
        apiKey: this.apiKey,
        transportMode: "car",
        origin: `${start.latitude},${start.longitude}`,
        destination: `${end.latitude},${end.longitude}`,
        return: "summary,polyline",
        alternatives: maxRoutes,
      };

      const response = await axios.get<HereRouteResponse>(
        `${this.baseUrl}/v8/routes`,
        { params },
      );

      if (!response.data.routes || response.data.routes.length <= 1) return [];

      return response.data.routes.slice(1).map((route) => {
        const sections = route.sections;
        const allCoords: [number, number][] = [];
        const legs: { distance: number; duration: number }[] = [];
        let totalDistance = 0;
        let totalDuration = 0;

        for (const section of sections) {
          totalDistance += section.summary.length;
          totalDuration += section.summary.duration;
          allCoords.push(...decodeFlexiPolyline(section.polyline));
          legs.push({
            distance: section.summary.length,
            duration: section.summary.duration,
          });
        }

        return {
          totalDistance,
          totalDuration,
          coordinates: allCoords,
          legs,
        };
      });
    } catch (error) {
      logger.error("HereMaps alternative routes error:", { error });
      return [];
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/v8/routes`, {
        params: {
          apiKey: this.apiKey,
          transportMode: "car",
          origin: "28.6139,77.209",
          destination: "28.6200,77.215",
          return: "summary",
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private buildNavigationInstructions(
    sections: HereSection[],
  ): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];
    let cumulativeDistance = 0;
    let cumulativeDuration = 0;

    for (let legIdx = 0; legIdx < sections.length; legIdx++) {
      const section = sections[legIdx];
      const actions = section.actions ?? [];

      if (actions.length > 0) {
        let prevOffset = 0;
        let prevDuration = 0;

        for (const action of actions) {
          const distanceDelta = (action.offset - prevOffset) / 1000;
          const durationDelta = action.duration - prevDuration;

          instructions.push({
            route_index: legIdx,
            instruction: action.instruction,
            distance_delta: distanceDelta,
            duration_delta: durationDelta,
            distance_from_start: (cumulativeDistance + action.offset) / 1000,
            duration_from_start: cumulativeDuration + action.duration,
            coordinates: [],
          });

          prevOffset = action.offset;
          prevDuration = action.duration;
        }
      } else {
        instructions.push({
          route_index: legIdx,
          instruction: `Navigate to waypoint ${legIdx + 1}`,
          distance_delta: section.summary.length / 1000,
          duration_delta: section.summary.duration,
          distance_from_start:
            (cumulativeDistance + section.summary.length) / 1000,
          duration_from_start: cumulativeDuration + section.summary.duration,
          coordinates: [],
        });
      }

      cumulativeDistance += section.summary.length;
      cumulativeDuration += section.summary.duration;
    }

    return instructions;
  }
}

export const hereMapsService = new HereMapsService();
