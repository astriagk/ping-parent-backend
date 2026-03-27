/**
 * Google Maps API client — only makes HTTP calls, no response parsing.
 * All response transformation lives in googlemaps.data-mapper.ts
 */
import {
  Client,
  DirectionsRequest,
  DirectionsResponse,
  TrafficModel,
  TravelMode,
  UnitSystem,
} from "@googlemaps/google-maps-services-js";
import {
  ERROR_MESSAGES,
  GoogleMapsAvoidOption,
  GoogleMapsTrafficModel,
  HTTP_STATUS,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { logger } from "@shared/utils";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteOptions {
  trafficModel?: GoogleMapsTrafficModel;
  avoid?: GoogleMapsAvoidOption[];
  departureTime?: Date;
}

const TRAFFIC_MODEL_MAP: Record<GoogleMapsTrafficModel, TrafficModel> = {
  [GoogleMapsTrafficModel.BEST_GUESS]: TrafficModel.best_guess,
  [GoogleMapsTrafficModel.PESSIMISTIC]: TrafficModel.pessimistic,
  [GoogleMapsTrafficModel.OPTIMISTIC]: TrafficModel.optimistic,
};

class GoogleMapsApiService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    this.client = new Client({});
    if (!this.apiKey) {
      logger.warn("GOOGLE_MAPS_API_KEY not configured");
    }
  }

  /**
   * Call Google Directions API with optimizeWaypoints=true.
   * Returns the raw Google API response — caller is responsible for parsing.
   * Max 25 waypoints.
   */
  async getOptimizedDirections(
    startPoint: Coordinate,
    waypoints: Coordinate[],
    options?: RouteOptions,
  ): Promise<DirectionsResponse> {
    try {
      if (waypoints.length > 25) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_MESSAGES.GOOGLEMAPS.WAYPOINT_LIMIT_EXCEEDED,
        );
      }

      const origin = `${startPoint.latitude},${startPoint.longitude}`;
      const lastWaypoint = waypoints[waypoints.length - 1];
      const destination = `${lastWaypoint.latitude},${lastWaypoint.longitude}`;

      const params: DirectionsRequest["params"] = {
        origin,
        destination,
        mode: TravelMode.driving,
        units: UnitSystem.metric,
        departure_time: options?.departureTime || new Date(),
        traffic_model:
          TRAFFIC_MODEL_MAP[
            options?.trafficModel || GoogleMapsTrafficModel.BEST_GUESS
          ],
        key: this.apiKey,
      };

      // Add intermediate waypoints with optimization (skip if only 1 waypoint)
      if (waypoints.length > 1) {
        const intermediates = waypoints
          .slice(0, -1)
          .map((wp) => `${wp.latitude},${wp.longitude}`);
        params.waypoints = intermediates;
        params.optimize = true;
      }

      if (options?.avoid && options.avoid.length > 0) {
        params.avoid = options.avoid as any;
      }

      const response = await this.client.directions({ params });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.GOOGLEMAPS.API_ERROR,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("Google Maps Directions API error:", { error });
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.GOOGLEMAPS.API_ERROR,
      );
    }
  }
}

export const googleMapsApiService = new GoogleMapsApiService();
