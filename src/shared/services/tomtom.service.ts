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
   * Calculate optimal sequence using TomTom Matrix API
   * Uses real road distances for accurate route optimization
   * Returns optimal order of waypoints to minimize total distance
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

      // Use routing API to calculate distances from start to each waypoint
      // Build array of route requests (start -> each waypoint)
      const distances: number[] = [];

      for (let i = 0; i < waypoints.length; i++) {
        try {
          const waypoint = waypoints[i];
          const pointsString = `${startPoint.latitude},${startPoint.longitude}:${waypoint.latitude},${waypoint.longitude}`;
          const url = `${this.baseUrl}/routing/1/calculateRoute/${pointsString}/json`;

          const response = await axios.get<TomTomRouteResponse>(url, {
            params: {
              key: this.apiKey,
            },
          });

          if (response.data.routes && response.data.routes.length > 0) {
            const distance = response.data.routes[0].summary.lengthInMeters;
            distances.push(distance);
          } else {
            distances.push(0);
          }
        } catch (err) {
          logger.error(`Error calculating distance to waypoint ${i}:`, { err });
          distances.push(0);
        }
      }

      // Sort waypoints by distance and return indices
      const sequence = waypoints
        .map((_, i) => ({ index: i, distance: distances[i] }))
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.index);

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
