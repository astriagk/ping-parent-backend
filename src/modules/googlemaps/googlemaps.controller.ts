import { Request, Response } from "express";

import { tripRepository } from "@modules/trips/trip/trip.repository";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  RouteProvider,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  calculateGoogleRoute,
  cleanOldGoogleTrackingData,
  getGoogleRouteDetails,
  getGoogleRouteTracking,
  getLatestGoogleDriverPosition,
  recalculateGoogleRoute,
  updateGoogleDriverPosition,
} from "./googlemaps.service";

export const calculateGoogleRouteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { trip_id } = req.body;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    if (!trip_id) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.GOOGLEMAPS.TRIP_ID_REQUIRED,
      );
    }

    // Check if trip already has a cached route from Google Maps
    const existingTrip = await tripRepository.findById(trip_id);

    if (
      existingTrip &&
      existingTrip.optimized_route_data &&
      existingTrip.route_provider === RouteProvider.GOOGLE_MAPS &&
      existingTrip.optimized_route_data.polyline_encoded
    ) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          _id: existingTrip._id?.toString(),
          trip_id: existingTrip._id?.toString(),
          route_geometry: existingTrip.optimized_route_data,
          total_distance: existingTrip.optimized_route_data.total_distance,
          total_duration: existingTrip.optimized_route_data.total_duration,
        },
        message: SUCCESS_MESSAGES.GOOGLEMAPS.ROUTE_DETAILS_FETCHED,
      });
    }

    const result = await calculateGoogleRoute(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: result.message,
    });
  },
);

export const recalculateGoogleRouteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const result = await recalculateGoogleRoute(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: result.message,
    });
  },
);

export const updateGooglePositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { tripId } = req.params as Record<string, string>;
    const { latitude, longitude, speed, heading, accuracy } = req.body;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.GOOGLEMAPS.TRIP_ID_REQUIRED,
      );
    }

    const tracking = await updateGoogleDriverPosition(
      userId,
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
    );

    return res.json({
      success: true,
      data: tracking,
      message: SUCCESS_MESSAGES.GOOGLEMAPS.POSITION_UPDATED,
    });
  },
);

export const getGoogleTrackingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;
    const limitQuery = req.query.limit as string | undefined;

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.GOOGLEMAPS.TRIP_ID_REQUIRED,
      );
    }

    // Parse limit from query string with default fallback
    const limit = limitQuery
      ? Math.max(1, Math.min(Number(limitQuery), 100))
      : 100;
    const tracking = await getGoogleRouteTracking(tripId, limit);

    return res.json({
      success: true,
      data: tracking,
      count: tracking.length,
      message: SUCCESS_MESSAGES.GOOGLEMAPS.TRACKING_FETCHED,
    });
  },
);

export const getCurrentGooglePositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.GOOGLEMAPS.TRIP_ID_REQUIRED,
      );
    }

    const position = await getLatestGoogleDriverPosition(tripId);

    if (!position) {
      return res.json({
        success: true,
        data: null,
        message: SUCCESS_MESSAGES.GOOGLEMAPS.NO_POSITION_DATA,
      });
    }

    return res.json({
      success: true,
      data: position,
      message: SUCCESS_MESSAGES.GOOGLEMAPS.CURRENT_POSITION_RETRIEVED,
    });
  },
);

export const getGoogleRouteDetailsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.GOOGLEMAPS.TRIP_ID_REQUIRED,
      );
    }

    const routeDetails = await getGoogleRouteDetails(tripId);

    return res.json({
      success: true,
      data: routeDetails,
      message: SUCCESS_MESSAGES.GOOGLEMAPS.ROUTE_DETAILS_FETCHED,
    });
  },
);

export const cleanGoogleTrackingDataHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { daysOld } = req.body;

    if (!daysOld || daysOld < 1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.GOOGLEMAPS.DAYS_OLD_INVALID,
      );
    }

    const deletedCount = await cleanOldGoogleTrackingData(daysOld);

    return res.json({
      success: true,
      data: {
        deletedCount,
        message: SUCCESS_MESSAGES.GOOGLEMAPS.CLEANUP_RECORDS_DELETED.replace(
          "{count}",
          deletedCount.toString(),
        ),
      },
      message: SUCCESS_MESSAGES.GOOGLEMAPS.CLEANUP_COMPLETED,
    });
  },
);
