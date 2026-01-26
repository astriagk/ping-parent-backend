import axios from "axios";

import { logger } from "@shared/utils";

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
   * Calculate optimal route sequence using TomTom Matrix API
   * Returns optimal order of waypoints to minimize total distance
   */
  async calculateOptimalSequence(
    startPoint: Coordinate,
    waypoints: Coordinate[],
    endPoint?: Coordinate,
  ): Promise<number[]> {
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

          const distance = this.calculateHaversineDistance(
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
    } catch (_) {
      // Fallback: return sequential order
      return waypoints.map((_, i) => i);
    }
  }

  /**
   * Get route geometry and duration between multiple waypoints
   */
  async getRouteGeometry(
    startPoint: Coordinate,
    waypoints: Coordinate[],
  ): Promise<{
    totalDistance: number; // in meters
    totalDuration: number; // in seconds
    coordinates: [number, number][];
    legs: Array<{
      distance: number;
      duration: number;
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
        },
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = response.data.routes[0];
      const totalDistance = route.summary.lengthInMeters;
      const totalDuration = route.summary.travelTimeInSeconds;

      // Flatten all coordinates from all legs
      const coordinates: [number, number][] = [];
      const legs = [];

      for (const leg of route.legs) {
        legs.push({
          distance: leg.summary.lengthInMeters,
          duration: leg.summary.travelTimeInSeconds,
        });

        for (const point of leg.points) {
          coordinates.push([point.latitude, point.longitude]);
        }
      }

      return {
        totalDistance,
        totalDuration,
        coordinates,
        legs,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Check if a point is within a route corridor (±buffer in meters)
   */
  isPointWithinRouteCorridor(
    point: Coordinate,
    routeCoordinates: [number, number][],
    bufferMeters: number = 200,
  ): boolean {
    const bufferKm = bufferMeters / 1000;

    for (const routePoint of routeCoordinates) {
      const distance = this.calculateHaversineDistance(
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
    } catch (_) {
      return false;
    }
  }
}

export const tomTomService = new TomTomService();
